# Brace - Crypto Trading Platform

hand-on solo developing
A full-stack cryptocurrency trading platform built with modern technologies.

## Technologies

- Frontend: React.js with modern hooks and real-time updates
- Backend: FastAPI (Python) with async support
- Database: Supabase (PostgreSQL)
- Authentication: Supabase Auth
- Deployment: Render

## Features

- Secure user authentication and authorization
- Real-time cryptocurrency price tracking
- Advanced order management system
- User profile management
- Live market data integration
- Responsive design for all devices

## Local Development

1. Clone the repository:

   ```bash
   git clone https://github.com/FarhangKhanjani/Brace.git
   cd Brace
   ```

2. Install dependencies:

   ```bash
   # Backend
   pip install -r requirements.txt

   # Frontend
   npm install
   ```

3. Set up environment variables:

   ```bash
   # Create .env file
   cp .env.example .env
   # Add your Supabase credentials
   ```

4. Run the application:

   ```bash
   # Backend (in one terminal)
   uvicorn main:app --reload --port 8080

   # Frontend (in another terminal)
   npm start
   ```

5. Visit http://localhost:3000 in your browser

## API Documentation

- FastAPI Swagger UI: http://localhost:8080/docs
- API Endpoints:
  - Authentication: /login, /signup
  - Orders: /orders
  - Market Data: /top-cryptos, /price/{symbol}

## Deployment

This application is configured for deployment on Render:

- Backend: Python web service
- Frontend: Static site
- Environment variables managed through Render dashboard

## Contributing

Feel free to open issues and submit pull requests.

## License

MIT License

## Live Demo

- Frontend: https://brace-frontend.onrender.com
- Backend API: https://brace-k7uz.onrender.com
- API Documentation: https://brace-k7uz.onrender.com/docs
  #   B r a c e 
   
   
