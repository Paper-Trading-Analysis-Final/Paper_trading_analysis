from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
import yfinance as yf
import numpy as np
import logging
from typing import List, Optional
from datetime import datetime
import asyncio

import sqlalchemy
from database import engine, get_db
import models
from auth import get_password_hash, verify_password, create_access_token, get_current_user
from signal_engine import get_signal
from services.gamification_service import process_trade_gamification, get_user_gamification
from services.leaderboard_service import get_leaderboard


# Create database tables
models.Base.metadata.create_all(bind=engine)
with engine.connect() as conn:
    try:
        conn.execute(sqlalchemy.text("ALTER TABLE trades ADD COLUMN realized_pnl FLOAT"))
        conn.commit()
    except Exception:
        pass

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Schemas ---
class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    age: Optional[str] = None
    gender: Optional[str] = None
    location: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TradeRequest(BaseModel):
    symbol: str
    quantity: int
    price: float
    type: str

# --- Helpers ---
def normalize_symbol(symbol: str) -> str:
    symbol = symbol.strip().upper()
    mapping = {
        "MAHINDRA & MAHINDRA": "M&M.NS",
        "M&M": "M&M.NS",
        "NIFTY 50": "^NSEI",
        "SENSEX": "^BSESN"
    }
    if symbol in mapping:
        return mapping[symbol]
    if symbol.endswith(".NS") or symbol.endswith(".BO") or symbol.startswith("^"):
        return symbol
    us_stocks = {"AAPL", "GOOGL", "MSFT", "AMZN", "META", "NVDA", "TSLA", "NFLX"}
    if symbol in us_stocks:
        return symbol
    return symbol + ".NS"

def safe_float(val):
    try:
        if np.isnan(val) or np.isinf(val):
            return 0.0
        return float(val)
    except:
        return 0.0

# --- Auth Endpoints ---

@app.post("/signup", response_model=Token)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter((models.User.email == user.email) | (models.User.username == user.username)).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email or username already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = models.User(
        username=user.username,
        email=user.email,
        password_hash=hashed_password,
        age=user.age,
        gender=user.gender,
        location=user.location
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Initialize wallet with 10,000
    new_wallet = models.Wallet(user_id=new_user.id, balance=100000.0)
    db.add(new_wallet)
    db.commit()

    access_token = create_access_token(data={"sub": str(new_user.id)})
    return {"access_token": access_token, "token_type": "bearer", "username": new_user.username}

@app.post("/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": str(db_user.id)})
    return {"access_token": access_token, "token_type": "bearer", "username": db_user.username}


# --- Authenticated User Endpoints ---

@app.get("/wallet")
def get_wallet(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    wallet = db.query(models.Wallet).filter(models.Wallet.user_id == current_user.id).first()
    return {"balance": wallet.balance if wallet else 0}

@app.get("/portfolio")
def get_portfolio(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    portfolio = db.query(models.Portfolio).filter(models.Portfolio.user_id == current_user.id).all()
    return [{"symbol": p.symbol, "quantity": p.quantity, "average_price": p.average_price} for p in portfolio]

@app.get("/trades/history")
def get_trades_history(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    trades = db.query(models.Trade).filter(models.Trade.user_id == current_user.id).order_by(models.Trade.time.desc()).all()
    return [{"id": t.id, "symbol": t.symbol, "type": t.type, "quantity": t.quantity, "price": t.price, "time": t.time, "status": t.status} for t in trades]

@app.post("/trade")
def execute_trade(trade: TradeRequest, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    wallet = db.query(models.Wallet).filter(models.Wallet.user_id == current_user.id).first()
    if not wallet:
        raise HTTPException(status_code=400, detail="Wallet not found")

    total_cost = trade.price * trade.quantity
    is_win = False

    realized_pnl = 0.0
    if trade.type.upper() == "BUY":
        if wallet.balance < total_cost:
            raise HTTPException(status_code=400, detail="Insufficient funds")
        wallet.balance -= total_cost
        
        portfolio_entry = db.query(models.Portfolio).filter(models.Portfolio.user_id == current_user.id, models.Portfolio.symbol == trade.symbol).first()
        if portfolio_entry:
            # Update average price
            total_value = (portfolio_entry.quantity * portfolio_entry.average_price) + total_cost
            portfolio_entry.quantity += trade.quantity
            portfolio_entry.average_price = total_value / portfolio_entry.quantity
        else:
            portfolio_entry = models.Portfolio(user_id=current_user.id, symbol=trade.symbol, quantity=trade.quantity, average_price=trade.price)
            db.add(portfolio_entry)
            
    elif trade.type.upper() == "SELL":
        portfolio_entry = db.query(models.Portfolio).filter(models.Portfolio.user_id == current_user.id, models.Portfolio.symbol == trade.symbol).first()
        if not portfolio_entry or portfolio_entry.quantity < trade.quantity:
            raise HTTPException(status_code=400, detail="Insufficient shares to sell")
        
        realized_pnl = (trade.price - portfolio_entry.average_price) * trade.quantity
        if trade.price > portfolio_entry.average_price:
            is_win = True

        wallet.balance += total_cost
        portfolio_entry.quantity -= trade.quantity
        if portfolio_entry.quantity == 0:
            db.delete(portfolio_entry)

    # Record trade
    new_trade = models.Trade(
        user_id=current_user.id,
        symbol=trade.symbol,
        type=trade.type.upper(),
        quantity=trade.quantity,
        price=trade.price,
        realized_pnl=realized_pnl
    )

    db.add(new_trade)
    db.commit()

    # Process gamification XP and stats after successful trade completion
    try:
        process_trade_gamification(db=db, user_id=current_user.id, is_win=is_win)
    except Exception as e:
        logger.error(f"Gamification update error: {str(e)}")

    return {"message": "Trade executed successfully", "balance": wallet.balance}


@app.get("/leaderboard")
def get_leaderboard_route(db: Session = Depends(get_db)):
    leaderboard_data = get_leaderboard(db)
    response = []
    for idx, entry in enumerate(leaderboard_data, start=1):
        response.append({
            "rank": idx,
            "username": entry["username"],
            "net_worth": entry["net_worth"],
            "return_percent": entry.get("portfolio_return_pct", 0.0),
            "win_rate": entry["win_rate"],
            "xp": entry["xp"],
            "level": entry["level"]
        })
    return response


@app.get("/user/gamification")
def get_user_gamification_route(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_user_gamification(db=db, user_id=current_user.id)




# --- Public Market Endpoints ---

@app.get("/")
def read_root():
    return {"message": "Data API is running", "endpoints": ["/stock/{symbol}", "/chart/{symbol}", "/trade", "/wallet"]}

@app.get("/stock/{symbol}")
def get_stock_data(symbol: str):
    try:
        norm_symbol = normalize_symbol(symbol)
        logger.info(f"Fetching stock data for {symbol} -> {norm_symbol}")
        stock = yf.Ticker(norm_symbol)
        data = stock.history(period="1d")
        if data.empty:
            return {"error": "No data found"}
        latest = data.iloc[-1]
        
        hist_5d = stock.history(period="5d")
        change = 0.0
        change_pct = 0.0
        if len(hist_5d) >= 2:
            prev_close = hist_5d["Close"].iloc[-2]
            curr_close = hist_5d["Close"].iloc[-1]
            change = curr_close - prev_close
            if prev_close != 0:
                change_pct = (change / prev_close) * 100

        return {
            "symbol": symbol,
            "open": safe_float(latest["Open"]),
            "high": safe_float(latest["High"]),
            "low": safe_float(latest["Low"]),
            "close": safe_float(latest["Close"]),
            "volume": int(latest["Volume"]) if not np.isnan(latest["Volume"]) else 0,
            "change": safe_float(change),
            "change_pct": safe_float(change_pct)
        }
    except Exception as e:
        logger.error(f"CRITICAL ERROR: Failed to fetch {symbol} - {str(e)}")
        return {"error": str(e)}

@app.get("/chart")
def get_chart_data(symbol: str, period: str = "1mo"):
    try:
        norm_symbol = normalize_symbol(symbol)
        yf_period = period.lower()
        if yf_period not in ["1d", "5d", "1mo", "3mo", "1y", "max"]:
            yf_period = "1mo"
            
        logger.info(f"Fetching chart for requested symbol '{symbol}' -> normalized '{norm_symbol}', period '{yf_period}'")
            
        stock = yf.Ticker(norm_symbol)
        interval = "1m" if yf_period == "1d" else "5m" if yf_period == "5d" else "1d"
        data = stock.history(period=yf_period, interval=interval)
        
        if data.empty:
            logger.warning(f"No chart data found for {norm_symbol}")
            return {"success": False, "error": "Unable to fetch chart data"}
        
        data = data.fillna(0)
        
        chart_data = []
        for index, row in data.iterrows():
            chart_data.append({
                "time": int(index.timestamp() * 1000),
                "open": safe_float(row["Open"]),
                "high": safe_float(row["High"]),
                "low": safe_float(row["Low"]),
                "close": safe_float(row["Close"]),
                "volume": int(row["Volume"])
            })
        return chart_data
    except Exception as e:
        logger.error(f"Error fetching chart for {symbol}: {str(e)}")
        return {"success": False, "error": "Unable to fetch chart data"}

@app.get("/signal/{symbol}")
async def signal_endpoint(symbol: str, company: str = ""):
    """
    Returns composite Buy/Sell/Hold signal for a given stock symbol.
    Executes in a non-blocking thread to prevent holding up the FastAPI event loop.
    """
    try:
        # Step 9: Use asyncio.to_thread to run synchronous operations (yfinance, requests) safely
        result = await asyncio.to_thread(get_signal, symbol, company)
        return result
    except Exception as e:
        logger.error(f"Error in signal endpoint for {symbol}: {str(e)}")
        # Fallback in case even the engine's try-catch failed unexpectedly
        from signal_engine import _error_response
        return _error_response("Internal API error")

if __name__ == '__main__':
    import uvicorn
    uvicorn.run("data_app:app", host="0.0.0.0", port=8000, reload=True)
