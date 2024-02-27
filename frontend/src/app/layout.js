import "./globals.css";
import Navbar from "./components/Navbar";


export const metadata = {
  title: "ShotChain",
  description: "Starknet Denver Hackathon 2024",
  icons: {
    icon: '/IlliniBlockchainLogo.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar>
        </Navbar>
        {children}
      </body>
    </html>
  );
}
