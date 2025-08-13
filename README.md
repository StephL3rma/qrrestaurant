# QR Restaurant - Digital Menu & Ordering System

A modern restaurant ordering system where each table has its own QR code for individual ordering and payment. No more splitting bills or waiting for the check!

## Features

- 🍽️ **QR Code Menus**: Each table gets a unique QR code
- 💰 **Individual Payments**: Customers order and pay individually  
- 🔄 **Real-time Orders**: Live order updates for restaurant staff
- 📱 **Mobile Optimized**: Works on any smartphone
- 💳 **Stripe Integration**: Secure payment processing
- 🔐 **Restaurant Auth**: Secure login for restaurant management

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Prisma ORM + SQLite (production: PostgreSQL)
- **Auth**: NextAuth.js
- **Payments**: Stripe
- **Deployment**: Vercel

## Local Development

1. **Clone & Install**
   ```bash
   git clone <your-repo>
   cd qrrestaurant
   npm install
   ```

2. **Environment Setup**
   Copy the environment variables:
   ```bash
   # Database
   DATABASE_URL="file:./dev.db"
   
   # NextAuth
   NEXTAUTH_SECRET="your-secret-key-change-in-production"
   NEXTAUTH_URL="http://localhost:3000"
   
   # Stripe (get from https://stripe.com)
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
   STRIPE_SECRET_KEY="sk_test_..."
   ```

3. **Database Setup**
   ```bash
   npx prisma migrate dev
   ```

4. **Start Development**
   ```bash
   npm run dev
   ```

5. **Open Application**
   Visit [http://localhost:3000](http://localhost:3000)

## Usage

### For Restaurants

1. **Setup**
   - Register at `/auth/register`
   - Add menu items in dashboard
   - Create tables and generate QR codes

2. **Daily Operations**
   - View orders in real-time dashboard
   - Update order status (Confirmed → Preparing → Ready → Delivered)
   - Print QR codes for tables

### For Customers

1. **Ordering**
   - Scan QR code at table
   - Browse menu and add items
   - Enter name for order tracking
   - Pay with Apple Pay/Google Pay/Card

2. **Experience**
   - No app download required
   - Individual ordering per person
   - Real-time order updates

## Deployment on Vercel

1. **Repository Setup**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Vercel Deployment**
   - Connect GitHub repo to Vercel
   - Set environment variables in Vercel dashboard
   - Deploy automatically

3. **Environment Variables**
   ```
   NEXTAUTH_SECRET=your-production-secret
   NEXTAUTH_URL=https://your-app.vercel.app
   DATABASE_URL=your-postgres-connection-string
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   ```

## Cost Structure

- **Development**: $0 (all open source)
- **Hosting**: Free tier on Vercel
- **Database**: Free PostgreSQL on Vercel/Railway
- **Payments**: Stripe fees (2.9% + 30¢ per transaction)
- **Scaling**: Only pay as you grow

## Next Steps

- [ ] Add inventory management
- [ ] Restaurant analytics dashboard  
- [ ] Multi-language support
- [ ] Push notifications for order updates
- [ ] WhatsApp/SMS integration
- [ ] Loyalty program features

## Built With Next.js

This project uses [Next.js](https://nextjs.org) and is optimized for performance and developer experience.
