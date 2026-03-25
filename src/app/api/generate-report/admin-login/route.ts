import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    
    const envPassword = process.env.ADMIN_PASSWORD;

    // 🕵️ DEBUG: This will print exactly what the server sees in your terminal
    console.log("Typed Password:", password);
    console.log("Server .env Password:", envPassword);
    
    // We use .trim() to chop off any invisible spaces at the end of the text
    if (password?.trim() === envPassword?.trim() && envPassword) {
      
      cookies().set('admin_token', 'acet_secure_session_active', {
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