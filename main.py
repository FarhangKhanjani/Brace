from fastapi import FastAPI, Request, HTTPException, Depends, Form
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv
import os
from datetime import datetime
from typing import Optional, List
import requests
import uuid

# Load environment variables
load_dotenv()
print(f"Supabase URL: {os.getenv('SUPABASE_URL')}")
print(f"Supabase Key exists: {bool(os.getenv('SUPABASE_KEY'))}")

# After load_dotenv()
print("Debug environment variables:")
print(f"URL being used: '{os.getenv('SUPABASE_URL')}'")  # Note the quotes to see any spaces
print(f"Key being used: '{os.getenv('SUPABASE_KEY')}'")

# Initialize FastAPI
app = FastAPI(
    title="Crypto API",
    description="Simple crypto API with auth",
    version="1.0.0"
)

# Update CORS middleware with your frontend URL
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8080",
        "https://your-render-url.onrender.com"  # Add your Render URL here
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase
supabase: Client = None

try:
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    # Debug prints
    print("Attempting Supabase connection with:")
    print(f"URL: {supabase_url}")
    print(f"Key length: {len(supabase_key) if supabase_key else 0}")
    
    if not supabase_url or not supabase_key:
        raise ValueError("Supabase URL or Key not found in environment variables")
    
    if not supabase_url.startswith("https://"):
        raise ValueError("Supabase URL must start with https://")
    
    if len(supabase_key) < 30:  # Supabase keys are typically very long
        raise ValueError("Supabase key appears to be invalid (too short)")
        
    supabase = create_client(supabase_url, supabase_key)
    
    # Test the connection with a simple query
    test = supabase.table('users').select("count").limit(1).execute()
    print("Supabase connection successful!")
    
except ValueError as ve:
    print(f"Configuration Error: {str(ve)}")
    raise HTTPException(status_code=500, detail=str(ve))
except Exception as e:
    print(f"Supabase Error: {str(e)}")
    raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")

# Setup templates
templates = Jinja2Templates(directory="templates")

# Models
class UserCreate(BaseModel):
    email: str
    password: str

class OrderCreate(BaseModel):
    user_id: str
    symbol: str
    entry_price: float
    stop_loss: float
    take_profit: float

class OrderResponse(BaseModel):
    id: str
    user_id: str
    symbol: str
    entry_price: float
    stop_loss: float
    take_profit: float
    created_at: datetime
        
    
@app.get("/", tags=["home"])
async def home():
    """
    Home endpoint that returns a welcome message
    """
    print("Home endpoint hit!")  # Debug log
    return {
        "message": "Welcome to the Crypto API",
        "version": "1.0.0",
        "documentation": "/docs"
    }        

@app.get("/test-db", tags=["test"])
async def test_db():
    """
    Test Supabase connection and show all users
    """
    try:
        # Get all users from the table
        response = supabase.table('users').select("*").execute()
        print(f"Found users: {response.data}")  # Debug print
        return {
            "message": "Database connection successful!",
            "user_count": len(response.data),
            "users": response.data
        }
    except Exception as e:
        print(f"Database error: {str(e)}")  # Debug print
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.post("/signup", tags=["auth"])
async def signup(user: UserCreate):
    """
    Create a new user using Supabase Auth
    """
    try:
        print(f"Attempting to create user with email: {user.email}")
        
        # Use Supabase auth client for signup
        auth_response = supabase.auth.sign_up({
            "email": user.email,
            "password": user.password
        })
        
        if auth_response.user:
            # Also create a profile in public.users table
            profile_data = {
                "id": auth_response.user.id,
                "email": user.email,
                "created_at": datetime.now().isoformat()
            }
            
            supabase.table('users').insert(profile_data).execute()
            
            return {
                "message": "User registered successfully",
                "email": user.email,
                "id": auth_response.user.id
            }
        
    except Exception as e:
        print(f"Signup error: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

@app.post("/login")
async def login(email: str = Form(...), password: str = Form(...)):
    try:
        print(f"Login attempt for email: {email}")
        
        # Use Supabase auth client for login
        auth_response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        
        if auth_response.user and auth_response.session:
            return {
                "access_token": auth_response.session.access_token,
                "user": {
                    "email": auth_response.user.email,
                    "id": auth_response.user.id
                }
            }
        
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    except Exception as e:
        print(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

# Live data endpoint
@app.get("/price/{symbol}", tags=["crypto"])
def get_price(symbol: str):
    """
    Get live price for a crypto symbol (e.g., BTC, ETH)
    """
    # Mock data for now
    prices = {
        "BTC": 45000,
        "ETH": 2500
    }
    return {"symbol": symbol, "price": prices.get(symbol, 0)}

@app.get("/top-cryptos", tags=["crypto"])
async def get_top_cryptos() -> List[dict]:
    """
    Get top cryptocurrencies from Binance
    """
    try:
        print("Fetching crypto data from Binance...")
        
        # Get ticker prices
        price_response = requests.get('https://api.binance.com/api/v3/ticker/price')
        
        # Get 24hr stats
        stats_response = requests.get('https://api.binance.com/api/v3/ticker/24hr')
        
        if price_response.status_code == 200 and stats_response.status_code == 200:
            prices = {item['symbol']: float(item['price']) for item in price_response.json()}
            stats = stats_response.json()
            
            # Filter for specific pairs we want (BTC, ETH, BNB, SOL)
            wanted_symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT']
            
            formatted_data = []
            for symbol in wanted_symbols:
                stat = next((item for item in stats if item['symbol'] == symbol), None)
                if stat:
                    formatted_data.append({
                        'symbol': symbol.replace('USDT', ''),
                        'price': float(stat['lastPrice']),
                        'change_24h': float(stat['priceChangePercent']),
                        'volume': float(stat['volume']),
                        'high_24h': float(stat['highPrice']),
                        'low_24h': float(stat['lowPrice'])
                    })
            
            print(f"Successfully fetched {len(formatted_data)} crypto pairs")
            return formatted_data
            
    except Exception as e:
        print(f"Error fetching crypto data: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to fetch crypto data: {str(e)}"
        )

@app.post("/orders", response_model=OrderResponse, tags=["orders"])
async def create_order(order: OrderCreate):
    """
    Create a new order in Supabase
    """
    try:
        print(f"Received order request: {order}")  # Debug log
        
        # Validate the user exists
        user_response = supabase.table('users')\
            .select('*')\
            .eq('id', order.user_id)\
            .execute()
            
        if not user_response.data:
            raise HTTPException(status_code=404, detail="User not found")

        order_data = {
            "id": str(uuid.uuid4()),
            "user_id": order.user_id,
            "symbol": order.symbol.upper(),
            "entry_price": float(order.entry_price),
            "stop_loss": float(order.stop_loss),
            "take_profit": float(order.take_profit),
            "status": "open",
            "created_at": datetime.now().isoformat()
        }
        
        print(f"Creating order with data: {order_data}")
        
        response = supabase.table('orders')\
            .insert(order_data)\
            .execute()
            
        print(f"Supabase response: {response}")
        
        if not response.data:
            raise HTTPException(
                status_code=400, 
                detail="Failed to create order in database"
            )
            
        return response.data[0]
            
    except Exception as e:
        print(f"Error creating order: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/orders/{user_id}", tags=["orders"])
async def get_user_orders(user_id: str):
    """
    Get all orders for a specific user
    """
    try:
        print(f"Fetching orders for user: {user_id}")
        response = supabase.table('orders')\
            .select("*")\
            .eq('user_id', user_id)\
            .execute()
            
        print(f"Found orders: {response.data}")
        return {"orders": response.data}
        
    except Exception as e:
        print(f"Error fetching orders: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/current-price/{symbol}", tags=["market"])
async def get_current_price(symbol: str):
    """
    Get current price for a symbol (mock data for now)
    """
    try:
        # Mock prices - in a real app, this would fetch from a crypto API
        mock_prices = {
            "BTC": 45000.00,
            "ETH": 3000.00,
            "BNB": 300.00,
            "SOL": 100.00
        }
        
        price = mock_prices.get(symbol.upper())
        if price is None:
            raise HTTPException(status_code=404, detail="Symbol not found")
            
        return {
            "symbol": symbol.upper(),
            "price": price
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

print(f"Current working directory: {os.getcwd()}")


