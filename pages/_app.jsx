import '../styles/globals.css';
import { validateEnvVars } from '../config';

/**
 * Main application component
 * 
 * This component is the entry point for the application.
 * It wraps all pages with common layout and functionality.
 * 
 * @param {Object} props - Component props
 * @param {React.Component} props.Component - The page component to render
 * @param {Object} props.pageProps - Props to pass to the page component
 */
function RustDok({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

/**
 * Server-side initialization
 * This function runs on both the server and client
 * It validates environment variables and initializes the application
 */
RustDok.getInitialProps = async (ctx) => {
  // Validate environment variables
  try {
    validateEnvVars();
    console.log('Environment variables validated successfully');
  } catch (error) {
    console.error('Environment validation error:', error.message);
    // We don't throw here to allow the application to continue with defaults
  }

  // Return empty props (individual pages will fetch their own data)
  return { pageProps: {} };
};

export default RustDok; 