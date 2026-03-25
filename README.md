## 📚 Grace Church CMS - Complete Setup Guide
## Project Overview
Grace Church CMS is a comprehensive content management system for churches, featuring:

Public-facing website with ministries, sermons, news, events, and more

Admin dashboard with role-based access control

File uploads (audio, images, documents)

Ministry registration management

Real-time updates using Supabase

## 🚀 Quick Start
Prerequisites
Node.js 18+

npm or yarn

Supabase account (free tier)

Git

Installation Steps
1. Clone the Repository
bash
git clone https://github.com/yourusername/grace-church-cms.git
cd grace-church-cms
2. Install Dependencies
bash
npm install
3. Set Up Supabase
a. Create a new Supabase project:

Go to supabase.com

Click "New project"

Name your project (e.g., "grace-church-cms")

Set a secure database password

Choose a region close to your users

b. Run the database schema:
Copy all SQL from the database-schema.sql file (provided below) and run in Supabase SQL editor.

c. Set up storage buckets:
Create these buckets in Supabase Storage:

public - For public images

sermon-audio - For sermon audio files

sermon-images - For sermon images

sermon-notes - For sermon notes (PDF/DOCX)

ministry-images - For ministry photos

project-images - For project images

hymn-covers - For hymn book covers

hymn-pdfs - For hymn book files

4. Environment Configuration
Create a .env file in the project root:

env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
Get these values from:

Supabase Dashboard → Settings → API

Project URL is your VITE_SUPABASE_URL

anon public key is your VITE_SUPABASE_ANON_KEY

5. Database Schema Setup
Run this SQL in your Supabase SQL editor:

sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (linked to auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    ministry_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create roles table
CREATE TABLE roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'media_admin', 'finance_admin', 'ministry_leader', 'secretary', 'project_manager', 'choir_leader', 'member')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ministries table
CREATE TABLE ministries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    leader_name TEXT,
    meeting_time TEXT,
    meeting_location TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create sermons table
CREATE TABLE sermons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    speaker TEXT NOT NULL,
    series TEXT,
    description TEXT,
    bible_passage TEXT,
    date_preached DATE,
    audio_url TEXT,
    video_url TEXT,
    image_url TEXT,
    notes_url TEXT,
    duration INTEGER,
    tags TEXT[],
    is_published BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create news table
CREATE TABLE news (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    summary TEXT,
    author_name TEXT,
    image_url TEXT,
    category TEXT,
    tags TEXT[],
    is_published BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create projects table
CREATE TABLE projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    goal TEXT,
    start_date DATE,
    end_date DATE,
    status TEXT CHECK (status IN ('planned', 'in_progress', 'completed', 'on_hold', 'cancelled')),
    progress INTEGER DEFAULT 0,
    budget DECIMAL(10,2),
    raised_amount DECIMAL(10,2) DEFAULT 0,
    project_manager TEXT,
    location TEXT,
    image_url TEXT,
    gallery_images TEXT[],
    is_public BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create hymn_books table
CREATE TABLE hymn_books (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    author TEXT,
    publisher TEXT,
    publication_year INTEGER,
    total_hymns INTEGER,
    cover_image_url TEXT,
    pdf_url TEXT,
    language TEXT DEFAULT 'English',
    is_public BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    download_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create service_programs table
CREATE TABLE service_programs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    service_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    service_type TEXT CHECK (service_type IN ('sunday_service', 'wednesday_service', 'prayer_meeting', 'bible_study', 'special_event', 'youth_service', 'children_service', 'other')),
    series TEXT,
    speaker TEXT,
    location TEXT,
    is_online BOOLEAN DEFAULT false,
    online_link TEXT,
    image_url TEXT,
    bulletin_url TEXT,
    worship_leader TEXT,
    musicians TEXT[],
    songs TEXT[],
    is_published BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create financial_transactions table
CREATE TABLE financial_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_date DATE NOT NULL,
    description TEXT NOT NULL,
    category_id UUID,
    amount DECIMAL(10,2) NOT NULL,
    type TEXT CHECK (type IN ('income', 'expense')),
    payment_method TEXT CHECK (payment_method IN ('cash', 'bank_transfer', 'cheque', 'mobile_money', 'other')),
    reference_number TEXT,
    receipt_number TEXT,
    notes TEXT,
    attachment_url TEXT,
    is_recurring BOOLEAN DEFAULT false,
    recurring_frequency TEXT CHECK (recurring_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create ministry_registrations table
CREATE TABLE ministry_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ministry_id UUID REFERENCES ministries(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    date_of_birth DATE,
    address TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    skills TEXT[],
    availability TEXT[],
    previous_experience TEXT,
    motivation TEXT,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'waiting_list')) DEFAULT 'pending',
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approval_date TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create choir_members table
CREATE TABLE choir_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    voice_part TEXT CHECK (voice_part IN ('soprano', 'alto', 'tenor', 'bass', 'other')),
    join_date DATE NOT NULL,
    exit_date DATE,
    is_active BOOLEAN DEFAULT true,
    is_leader BOOLEAN DEFAULT false,
    email TEXT,
    phone TEXT,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create choir_performances table
CREATE TABLE choir_performances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    performance_date DATE NOT NULL,
    venue TEXT,
    event_type TEXT CHECK (event_type IN ('sunday_service', 'special_service', 'concert', 'competition', 'outreach', 'recording', 'other')),
    songs_performed TEXT[],
    conductor TEXT,
    attendance INTEGER,
    notes TEXT,
    photos TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministries ENABLE ROW LEVEL SECURITY;
ALTER TABLE sermons ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE hymn_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministry_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE choir_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE choir_performances ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Example policies (customize based on your needs)
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public can view active ministries" ON ministries
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage ministries" ON ministries
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM roles WHERE role IN ('super_admin', 'admin', 'dean', 'ministry_leader')
        )
    );

-- Add more policies as needed...

-- Create indexes for performance
CREATE INDEX idx_sermons_date ON sermons(date_preached);
CREATE INDEX idx_news_published ON news(published_at);
CREATE INDEX idx_ministry_registrations_email ON ministry_registrations(email);
CREATE INDEX idx_projects_status ON projects(status);
6. Create Admin User
sql
-- Create an admin user (run after creating the user in Supabase Auth)
INSERT INTO roles (user_id, role) 
VALUES ('your-user-id-here', 'super_admin');
7. Run Development Server
bash
npm run dev
The application will be available at http://localhost:5173

8. Build for Production
bash
npm run build
The build output will be in the dist folder.


## Optional 
🚢 Deployment to Vercel
Automatic Deployment (Recommended)
Push your code to GitHub

Connect your repository to Vercel

Add environment variables in Vercel dashboard:

VITE_SUPABASE_URL

VITE_SUPABASE_ANON_KEY

Configure build settings:

Build Command: npm run build

Output Directory: dist

Install Command: npm install

Deploy

Manual Deployment
bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Set environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# Deploy to production
vercel --prod
📁 Project Structure
text
src/
├── components/
│   ├── admin/           # Admin dashboard components
│   │   ├── auth/        # Authentication components
│   │   ├── layout/      # Admin layout (sidebar, navbar)
│   │   └── tables/      # CRUD managers for each table
│   ├── public/          # Public-facing components
│   │   ├── home/        # Home page sections
│   │   ├── layout/      # Public layout (navbar, footer)
│   │   └── [pages]/     # Page-specific components
│   └── common/          # Reusable components
├── pages/
│   ├── admin/           # Admin pages
│   └── public/          # Public pages
├── hooks/               # Custom React hooks
├── lib/                 # Supabase client & utilities
├── utils/               # Helper functions
├── styles/              # CSS files
├── App.jsx              # Main app component
└── main.jsx            # Entry point
🔧 Environment Variables
Variable	Description	Required
VITE_SUPABASE_URL	Your Supabase project URL	Yes
VITE_SUPABASE_ANON_KEY	Your Supabase anonymous key	Yes
📝 Available Scripts
bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build locally
🔒 Security Best Practices
Always use environment variables for sensitive data

Enable Row Level Security on all tables

Validate and sanitize all user inputs

Use HTTPS in production

Implement rate limiting for authentication

Regularly update dependencies

Monitor Supabase logs for suspicious activity

Use strong passwords for admin accounts

Backup your database regularly

🐛 Troubleshooting
Common Issues & Solutions
Issue: Images not loading

Ensure images are in public/images/ folder

Use path /images/filename.jpg

Check Supabase storage bucket permissions

Issue: Authentication errors

Verify Supabase credentials in .env

Check RLS policies

Ensure user has role assigned in roles table

Issue: 404 on page refresh

Verify vercel.json has rewrite rules

Check that public/_redirects file exists

Issue: File upload fails

Check storage bucket permissions

Verify file size limits

Check file type restrictions

📊 Performance Optimization
Lazy load images using loading="lazy"

Optimize images before upload (compress)

Use React.memo for expensive components

Implement pagination for large datasets

Cache Supabase responses where appropriate

Use code splitting with React.lazy

🔄 Continuous Updates
To keep your project up to date:

bash
# Update dependencies
npm update

# Check for security vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
📞 Support & Resources
Supabase Documentation

React Documentation

Tailwind CSS Documentation

Vite Documentation

🎉 Congratulations!
You've successfully set up the Grace Church CMS. The application is now ready for use! For any issues or feature requests, please open an issue on GitHub.
