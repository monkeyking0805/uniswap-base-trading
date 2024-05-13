import './Test.css'

import React, { ChangeEvent, useCallback, useEffect, useState } from 'react'

import { CurrentConfig, Environment } from '../config'
import {
  connectBrowserExtensionWallet,
  getProvider,
  getWalletAddress,
  TransactionState,
} from '../libs/providers'
import { createTrade, executeTrade, TokenTrade } from '../libs/trading'
import { displayTrade } from '../libs/utils'
import { getCurrencyBalance, wrapETH } from '../libs/wallet'

const useOnBlockUpdated = (callback: (blockNumber: number) => void) => {
  useEffect(() => {
    const subscription = getProvider()?.on('block', callback)
    return () => {
      subscription?.removeAllListeners()
    }
  })
}

const Test = () => {
  const [trade, setTrade] = useState<TokenTrade>()
  const [txState, setTxState] = useState<TransactionState>(TransactionState.New)

  const [tokenInBalance, setTokenInBalance] = useState<string>()
  const [tokenOutBalance, setTokenOutBalance] = useState<string>()
  const [blockNumber, setBlockNumber] = useState<number>(0)
  const [tradeAmount, setTradeAmount] = useState<number>(1)

  //Listen for new trading amount
  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const floatValue = parseFloat(event.target.value) // Attempt to convert input to a float
    if (!isNaN(floatValue)) {
      setTradeAmount(floatValue) // Set the value if it's a valid float
    } else if (event.target.value === '') {
      setTradeAmount(1) // Allow the input to be cleared
    }
  }
  // Listen for new blocks and update the wallet
  useOnBlockUpdated(async (blockNumber: number) => {
    refreshBalances()
    setBlockNumber(blockNumber)
  })

  // Update wallet state given a block number
  const refreshBalances = useCallback(async () => {
    const provider = getProvider()
    const address = getWalletAddress()
    if (!address || !provider) {
      return
    }

    setTokenInBalance(
      await getCurrencyBalance(provider, address, CurrentConfig.tokens.in)
    )
    setTokenOutBalance(
      await getCurrencyBalance(provider, address, CurrentConfig.tokens.out)
    )
  }, [])

  // Event Handlers

  const onConnectWallet = useCallback(async () => {
    if (await connectBrowserExtensionWallet()) {
      refreshBalances()
    }
  }, [refreshBalances])

  const onCreateTrade = useCallback(async () => {
    refreshBalances()
    setTrade(await createTrade(tradeAmount))
  }, [refreshBalances, tradeAmount])

  const onTrade = useCallback(async (trade: TokenTrade | undefined) => {
    if (trade) {
      setTxState(await executeTrade(trade))
    }
  }, [])

  return (
    <div className="App">
      {CurrentConfig.rpc.mainnet === '' && (
        <h2 className="error">Please set your mainnet RPC URL in config.ts</h2>
      )}
      {CurrentConfig.env === Environment.WALLET_EXTENSION &&
        getProvider() === null && (
          <h2 className="error">
            Please install a wallet to use this example configuration
          </h2>
        )}
      <div className="tradeAmountContainer">
        <label htmlFor="tradeAmountInput">Trade Amount:</label>
        <input
          id="tradeAmountInput"
          type="number" // Set the input type to number for appropriate UI
          value={tradeAmount.toString()} // Convert the number to a string for the input element
          onChange={handleChange}
          step="1" // Allow decimal values in the input
        />
      </div>
      <h3>
        Trading {tradeAmount} {CurrentConfig.tokens.in.symbol} for{' '}
        {CurrentConfig.tokens.out.symbol}
      </h3>
      <h3>{trade && `Constructed Trade: ${displayTrade(trade)}`}</h3>
      <button onClick={onCreateTrade}>
        <p>Create Trade</p>
      </button>
      <h3>{`Wallet Address: ${getWalletAddress()}`}</h3>
      {CurrentConfig.env === Environment.WALLET_EXTENSION &&
        !getWalletAddress() && (
          <button onClick={onConnectWallet}>Connect Wallet</button>
        )}
      <h3>{`Block Number: ${blockNumber + 1}`}</h3>
      <h3>{`Transaction State: ${txState}`}</h3>
      <h3>{`${CurrentConfig.tokens.in.symbol} Balance: ${tokenInBalance}`}</h3>
      <h3>{`${CurrentConfig.tokens.out.symbol} Balance: ${tokenOutBalance}`}</h3>
      <button
        onClick={() => wrapETH(1000)}
        disabled={getProvider() === null || CurrentConfig.rpc.mainnet === ''}>
        <p>Wrap ETH</p>
      </button>
      <button
        onClick={() => onTrade(trade)}
        disabled={
          trade === undefined ||
          txState === TransactionState.Sending ||
          getProvider() === null ||
          CurrentConfig.rpc.mainnet === ''
        }>
        <p>Trade</p>
      </button>
    </div>
  )
}

export default Test
