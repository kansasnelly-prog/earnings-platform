import React from 'react';

interface SupabaseErrorProps {
  error: {
    message: string;
    details: string;
  };
}

const SupabaseError: React.FC<SupabaseErrorProps> = ({ error }) => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#f8d7da',
      color: '#721c24',
      padding: '20px',
      textAlign: 'center',
      fontFamily: 'sans-serif'
    }}>
      <div>
<h2>{error.message}</h2>
<p>{error.details}</p>
<p style={{
  marginTop: '20px',
  fontSize: '12px',
  color: '#856404'
}}>
  Please configure your Supabase Environment Variables in your hosting dashboard.
</p>
      </div>
    </div>
  );
};

export default SupabaseError;
