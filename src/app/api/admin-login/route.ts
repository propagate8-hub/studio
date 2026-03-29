import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    
    const envPassword = process.env.ADMIN_PASSWORD;
    
    // Debug tracker
    console.log("Typed Password:", password);
    console.log("Server .env Password:", envPassword);
    
    // Check password and trim spaces
    if (password?.trim() === envPassword?.trim() && envPassword) {
      
      // Next.js 15 compliant async cookies
      const cookieStore = await cookies();
      cookieStore.set('admin_token', 'acet_secure_session_active', {
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        maxAge: 60 * 60 * 24 * 7, 
        path: '/',
      });
      
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}