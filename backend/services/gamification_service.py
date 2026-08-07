import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
import models

def calculate_level(xp: int) -> int:
    """Calculates level from XP (Level 1 at 0 XP, Level 2 at 500 XP, etc.)"""
    return (xp // 500) + 1

BADGES_DEFINITIONS = [
    {
        "name": "First Trade",
        "description": "Completed your first paper trade on the platform.",
        "condition": lambda stats, profit, level: stats.total_trades >= 1
    },
    {
        "name": "5 Winning Trades",
        "description": "Successfully closed 5 profitable trades.",
        "condition": lambda stats, profit, level: stats.total_wins >= 5
    },
    {
        "name": "10 Winning Trades",
        "description": "Successfully closed 10 profitable trades.",
        "condition": lambda stats, profit, level: stats.total_wins >= 10
    },
    {
        "name": "Level 5",
        "description": "Reached Level 5 trader status.",
        "condition": lambda stats, profit, level: level >= 5
    },
    {
        "name": "₹10,000 Profit",
        "description": "Achieved ₹10,000 or more in total realized trading profit.",
        "condition": lambda stats, profit, level: profit >= 10000.0
    }
]

def check_and_unlock_badges(db: Session, user_id: int, stats: models.GamificationStats):
    """
    Checks conditions for all predefined badges and automatically unlocks
    any eligible badges that have not been unlocked yet without creating duplicates.
    """
    level = calculate_level(stats.xp)
    
    # Calculate total profit from wallet balance and trades
    wallet = db.query(models.Wallet).filter(models.Wallet.user_id == user_id).first()
    wallet_profit = (wallet.balance - 100000.0) if wallet and wallet.balance > 100000.0 else 0.0
    trade_profit = db.query(func.sum(models.Trade.realized_pnl)).filter(
        models.Trade.user_id == user_id,
        models.Trade.realized_pnl > 0
    ).scalar() or 0.0
    total_profit = max(wallet_profit, float(trade_profit))

    # Existing unlocked badge IDs for this user
    existing_badge_ids = {
        ub.badge_id for ub in db.query(models.UserBadge).filter(models.UserBadge.user_id == user_id).all()
    }

    for badge_def in BADGES_DEFINITIONS:
        if badge_def["condition"](stats, total_profit, level):
            badge = db.query(models.Badge).filter(models.Badge.name == badge_def["name"]).first()
            if not badge:
                badge = models.Badge(name=badge_def["name"], description=badge_def["description"])
                db.add(badge)
                db.commit()
                db.refresh(badge)

            if badge.id not in existing_badge_ids:
                new_user_badge = models.UserBadge(
                    user_id=user_id,
                    badge_id=badge.id,
                    unlocked_at=datetime.datetime.utcnow()
                )
                db.add(new_user_badge)
                existing_badge_ids.add(badge.id)

    db.commit()

def process_trade_gamification(db: Session, user_id: int, is_win: bool = False, base_xp: int = 100) -> models.GamificationStats:
    """
    Updates gamification stats for a user after a trade completes:
    - Increments total_trades
    - Increments total_wins if the trade is profitable
    - Awards XP based on activity and win status
    - Automatically unlocks eligible badges
    """
    stats = db.query(models.GamificationStats).filter(models.GamificationStats.user_id == user_id).first()
    if not stats:
        stats = models.GamificationStats(user_id=user_id, xp=0, total_wins=0, total_trades=0)
        db.add(stats)
        db.commit()
        db.refresh(stats)

    stats.total_trades += 1
    
    xp_gained = base_xp
    if is_win:
        stats.total_wins += 1
        xp_gained += 50  # Bonus XP for a profitable trade

    stats.xp += xp_gained
    db.commit()
    db.refresh(stats)

    # Automatically check and unlock badges
    check_and_unlock_badges(db=db, user_id=user_id, stats=stats)

    return stats


def get_user_gamification(db: Session, user_id: int) -> dict:
    """
    Retrieves user gamification details:
    - xp
    - level
    - badges (unlocked badges list)
    - total_trades
    - total_wins
    """
    stats = db.query(models.GamificationStats).filter(models.GamificationStats.user_id == user_id).first()
    if not stats:
        stats = models.GamificationStats(user_id=user_id, xp=0, total_wins=0, total_trades=0)
        db.add(stats)
        db.commit()
        db.refresh(stats)

    # Check for unlocked badges
    check_and_unlock_badges(db=db, user_id=user_id, stats=stats)

    level = calculate_level(stats.xp)

    user_badges = db.query(models.UserBadge).filter(models.UserBadge.user_id == user_id).all()
    badges = []
    for ub in user_badges:
        if ub.badge:
            badges.append({
                "id": ub.badge.id,
                "name": ub.badge.name,
                "description": ub.badge.description,
                "unlocked_at": ub.unlocked_at.isoformat() if ub.unlocked_at else None
            })

    return {
        "xp": stats.xp,
        "level": level,
        "badges": badges,
        "total_trades": stats.total_trades,
        "total_wins": stats.total_wins
    }

