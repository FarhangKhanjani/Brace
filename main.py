from fastapi import FastAPI, Request, HTTPException, Depends, Form
from fastapi.responses import HTMLResponse, JSONResponse
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

# Add these debug prints at the start
print("==== Environment Variables Debug ====")
print(f"Current working directory: {os.getcwd()}")
print(f"Environment variables present: {list(os.environ.keys())}")
print(f"SUPABASE_URL present: {'REACT_APP_SUPABASE_URL' in os.environ}")
print(f"SUPABASE_KEY present: {'SUPABASE_SERVICE_KEY' in os.environ}")
print("===================================")

# Initialize FastAPI
app = FastAPI(
    title="Crypto API",
    description="Simple crypto API with auth",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8080",
        "https://brace-api.onrender.com",  # Add your Render frontend URL
        "https://brace-frontend.onrender.com",   # Add other potential Render URLs
        "*"  # Optional: Allow all origins in development (remove in production)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase
supabase: Client = None

try:
    # Get environment variables
    supabase_url = os.getenv("REACT_APP_SUPABASE_URL")
    supabase_service_key = os.getenv("SUPABASE_SERVICE_KEY")
    
    # More detailed debug prints
    print("Attempting Supabase connection with:")
    print(f"URL: {supabase_url[:10]}... (length: {len(supabase_url) if supabase_url else 0})")
    print(f"Service Key available: {'Yes' if supabase_service_key else 'No'}")
    if supabase_service_key:
        print(f"Service Key length: {len(supabase_service_key)}")
    
    if not supabase_url or not supabase_service_key:
        raise ValueError("Supabase URL or Service Key not found in environment variables")
    
    if not supabase_url.startswith("https://"):
        raise ValueError("Supabase URL must start with https://")
    
    if len(supabase_service_key) < 30:  # Supabase service keys are typically very long
        raise ValueError("Supabase service key appears to be invalid (too short)")
        
    supabase = create_client(supabase_url, supabase_service_key)
    
    # Test the connection with a simple query
    test = supabase.table('users').select("count").limit(1).execute()
    print("Supabase connection successful!")
    
except ValueError as ve:
    print(f"Configuration Error: {str(ve)}")
    raise HTTPException(status_code=500, detail=str(ve))
except Exception as e:
    print(f"Supabase Error: {str(e)}")
    raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")

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
        print(f"Received order request: {order}")
        
        # Validate the user exists
        user_response = supabase.table('users')\
            .select('*')\
            .eq('id', order.user_id)\
            .execute()
            
        print(f"User lookup response: {user_response}")
            
        if not user_response.data:
            # Try to create the user if it doesn't exist
            try:
                print(f"User not found, attempting to create: {order.user_id}")
                new_user = {
                    "id": order.user_id,
                    "email": f"user_{order.user_id}@example.com",  # Placeholder
                    "password": "placeholder_password",  # Add a placeholder password
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat()
                }
                
                user_insert = supabase.table('users').insert(new_user).execute()
                print(f"User creation response: {user_insert}")
            except Exception as user_error:
                print(f"Failed to create user: {str(user_error)}")
                raise HTTPException(status_code=404, detail=f"User not found and could not be created: {str(user_error)}")

        # Create the order with explicit type conversions
        order_data = {
            "id": str(uuid.uuid4()),
            "user_id": str(order.user_id),  # Ensure user_id is a string
            "symbol": str(order.symbol).upper(),
            "entry_price": float(order.entry_price),
            "stop_loss": float(order.stop_loss),
            "take_profit": float(order.take_profit),
            "status": "open",
            "created_at": datetime.now().isoformat()
        }
        
        print(f"Creating order with data: {order_data}")
        
        try:
            response = supabase.table('orders')\
                .insert(order_data)\
                .execute()
                
            print(f"Order creation response: {response}")
            
            if not response.data:
                raise HTTPException(
                    status_code=400, 
                    detail="Failed to create order in database"
                )
                
            return response.data[0]
        except Exception as insert_error:
            print(f"Order insert error: {str(insert_error)}")
            # Try to get more detailed error information
            error_detail = str(insert_error)
            if hasattr(insert_error, 'details'):
                error_detail += f" Details: {insert_error.details}"
            raise HTTPException(status_code=500, detail=f"Order creation failed: {error_detail}")
            
    except HTTPException as he:
        raise he
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
    Get current price for a symbol from Binance
    """
    try:
        # Convert symbol to Binance format
        binance_symbol = f"{symbol}USDT"
        
        # Get real-time price from Binance
        response = requests.get(f'https://api.binance.com/api/v3/ticker/price?symbol={binance_symbol}')
        
        if response.status_code == 200:
            data = response.json()
            return {
                "symbol": symbol,
                "price": float(data['price'])
            }
        else:
            raise HTTPException(status_code=404, detail="Symbol not found")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/update-profile/{user_id}", tags=["auth"])
async def update_profile(
    user_id: str,
    request: Request
):
    """
    Update user profile in Supabase database
    """
    try:
        # Get request body
        body = await request.json()
        print(f"Updating profile for user: {user_id}")
        print(f"Update data: {body}")
        
        # Create update data with only provided fields
        update_data = {
            "updated_at": datetime.now().isoformat()
        }
        
        # Add fields from request body
        if "email" in body:
            update_data["email"] = body["email"]
        if "full_name" in body:
            update_data["full_name"] = body["full_name"]
        if "birth_date" in body:
            update_data["birth_date"] = body["birth_date"]
        if "nickname" in body:
            update_data["nickname"] = body["nickname"]
        if "gender" in body:
            update_data["gender"] = body["gender"]

        print(f"Final update data: {update_data}")
        
        # Update user in the users table
        response = supabase.table('users')\
            .update(update_data)\
            .eq('id', user_id)\
            .execute()
        
        print(f"Update response: {response}")
        
        if not response.data:
            raise HTTPException(status_code=404, detail="User not found or update failed")
            
        return {"message": "Profile updated successfully", "user": response.data[0]}
        
    except Exception as e:
        print(f"Profile update error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ensure-user", tags=["auth"])
async def ensure_user(user_data: dict):
    """
    Ensure a user exists in the users table
    """
    try:
        user_id = user_data.get("id")
        email = user_data.get("email")
        
        if not user_id or not email:
            raise HTTPException(status_code=400, detail="Missing user ID or email")
            
        print(f"Ensuring user exists: {user_id}, {email}")
        
        # Check if user exists
        user_response = supabase.table('users')\
            .select('*')\
            .eq('id', user_id)\
            .execute()
            
        # If user doesn't exist, create them
        if not user_response.data:
            print(f"Creating new user record for {user_id}")
            new_user = {
                "id": user_id,
                "email": email,
                "password": "placeholder_password",  # Add a placeholder password
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            
            insert_response = supabase.table('users').insert(new_user).execute()
            print(f"User creation response: {insert_response}")
            return {"message": "User created successfully", "user": insert_response.data[0]}
        
        return {"message": "User already exists", "user": user_response.data[0]}
            
    except Exception as e:
        print(f"Error ensuring user: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/orders/{order_id}", tags=["orders"])
async def delete_order(order_id: str):
    """
    Delete an order from Supabase
    """
    try:
        print(f"Deleting order: {order_id}")
        
        # First check if order exists
        order_check = supabase.table('orders')\
            .select('*')\
            .eq('id', order_id)\
            .execute()
            
        if not order_check.data:
            raise HTTPException(status_code=404, detail="Order not found")
            
        # Delete the order
        response = supabase.table('orders')\
            .delete()\
            .eq('id', order_id)\
            .execute()
            
        print(f"Delete response: {response}")
        
        return {"message": "Order deleted successfully"}
        
    except Exception as e:
        print(f"Error deleting order: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health", tags=["system"])
async def health_check():
    """
    Health check endpoint to verify the API is running
    """
    return {
        "status": "healthy",
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "development")
    }

print(f"Current working directory: {os.getcwd()}")


