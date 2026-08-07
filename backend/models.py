from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    age = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    location = Column(String, nullable=True)

    wallet = relationship("Wallet", back_populates="owner", uselist=False)
    trades = relationship("Trade", back_populates="owner")
    portfolio = relationship("Portfolio", back_populates="owner")
    predictions = relationship("Prediction", back_populates="owner")
    analytics = relationship("Analytic", back_populates="owner", uselist=False)


class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    balance = Column(Float, default=10000.0)

    owner = relationship("User", back_populates="wallet")


class Trade(Base):
    __tablename__ = "trades"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    symbol = Column(String, index=True)
    type = Column(String)  # 'BUY' or 'SELL'
    quantity = Column(Integer)
    price = Column(Float)
    realized_pnl = Column(Float, nullable=True)
    time = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String, default="COMPLETED")

    owner = relationship("User", back_populates="trades")


class Portfolio(Base):
    __tablename__ = "portfolio"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    symbol = Column(String, index=True)
    quantity = Column(Integer, default=0)
    average_price = Column(Float, default=0.0)

    owner = relationship("User", back_populates="portfolio")


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    symbol = Column(String)
    predicted_price = Column(Float)
    confidence = Column(Float)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="predictions")


class Analytic(Base):
    __tablename__ = "analytics"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    realized_pnl = Column(Float, default=0.0)
    discipline_score = Column(Float, default=10.0)

    owner = relationship("User", back_populates="analytics")


class GamificationStats(Base):
    __tablename__ = "gamification_stats"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    xp = Column(Integer, default=0)
    total_wins = Column(Integer, default=0)
    total_trades = Column(Integer, default=0)

    owner = relationship("User")


class Badge(Base):
    __tablename__ = "badges"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String)


class UserBadge(Base):
    __tablename__ = "user_badges"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    badge_id = Column(Integer, ForeignKey("badges.id"))
    unlocked_at = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User")
    badge = relationship("Badge")

