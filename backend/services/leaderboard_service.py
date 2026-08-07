from sqlalchemy.orm import Session
from typing import List, Dict, Any
import models
from services.gamification_service import calculate_level

INITIAL_BALANCE = 100000.0

def get_leaderboard(db: Session) -> List[Dict[str, Any]]:
    """
    Calculates and returns top 50 users sorted by Net Worth descending.
    Each item contains:
    - username
    - net_worth
    - portfolio_return_pct
    - win_rate
    - xp
    - level
    """
    users = db.query(models.User).all()
    leaderboard = []

    for user in users:
        # Wallet balance
        wallet = db.query(models.Wallet).filter(models.Wallet.user_id == user.id).first()
        cash = wallet.balance if wallet else INITIAL_BALANCE

        # Portfolio holdings value
        portfolio_items = db.query(models.Portfolio).filter(models.Portfolio.user_id == user.id).all()
        portfolio_value = sum(p.quantity * p.average_price for p in portfolio_items)

        net_worth = cash + portfolio_value
        portfolio_return_pct = round(((net_worth - INITIAL_BALANCE) / INITIAL_BALANCE) * 100.0, 2)

        # Gamification stats
        stats = db.query(models.GamificationStats).filter(models.GamificationStats.user_id == user.id).first()
        xp = stats.xp if stats else 0
        total_trades = stats.total_trades if stats else 0
        total_wins = stats.total_wins if stats else 0
        
        win_rate = round((total_wins / total_trades * 100.0), 2) if total_trades > 0 else 0.0
        level = calculate_level(xp)

        leaderboard.append({
            "username": user.username or f"Trader_{user.id}",
            "net_worth": round(net_worth, 2),
            "portfolio_return_pct": portfolio_return_pct,
            "win_rate": win_rate,
            "xp": xp,
            "level": level
        })

    # Sort by Net Worth descending
    leaderboard.sort(key=lambda x: x["net_worth"], reverse=True)

    return leaderboard[:50]
