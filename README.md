# Blockchain Donation Platform

A decentralized donation platform built on the Ethereum blockchain (Sepolia testnet) that allows users to create and manage donation campaigns.

## Features

- Create donation campaigns with title, description, and target amount
- View active campaigns with real-time progress tracking
- Make donations to campaigns using ETH
- MetaMask integration for secure transactions
- Real-time updates and notifications
- Responsive and modern UI

## Tech Stack

- **Frontend**: HTML, TailwindCSS, JavaScript
- **Backend**: Node.js, Express.js, TypeScript
- **Blockchain**: Ethereum (Sepolia), Web3.js, Solidity
- **Database**: MongoDB
- **Development**: Truffle, MetaMask

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- MetaMask browser extension
- Sepolia testnet ETH

## Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd donation-platform
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```
   PORT=3000
   MONGODB_URI=your_mongodb_connection_string
   ```

4. Deploy the smart contract (if not already deployed):
   ```bash
   truffle migrate --network sepolia
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Visit `http://localhost:3000` in your browser

## Smart Contract

The smart contract is deployed on the Sepolia testnet at: `0xc70a7B83D7B90AFEd24aFb03830AcD88114fbc8a`

## Usage

1. Connect your MetaMask wallet (make sure you're on Sepolia network)
2. Create a campaign by filling in the details and target amount
3. View active campaigns and their progress
4. Make donations to campaigns you want to support

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. 