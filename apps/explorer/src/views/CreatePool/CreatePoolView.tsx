import { ArrowRightIcon, ExclamationTriangleIcon, PlusIcon } from "@radix-ui/react-icons"
import { Button, Callout, Card, Dialog, Flex, Grid, Heading, Link, ScrollArea, Switch, Text } from "@radix-ui/themes"
import { useConnection } from "@solana/wallet-adapter-react"
import { ComputeBudgetProgram, PublicKey } from "@solana/web3.js"
import { decodeGambaState, getGambaStateAddress, getPoolAddress, isNativeMint } from "gamba-core-v2"
import { GAMBA_STANDARD_TOKEN_LIST } from "gamba-react-ui-v2"
import { useAccount, useGambaProvider, useSendTransaction, useWalletAddress } from "gamba-react-v2"
import React from "react"
import { useNavigate } from "react-router-dom"
import useSWR from "swr"

import { SelectableButton, TokenItem } from "@/components"
import { SYSTEM_PROGRAM } from "@/constants"
import { ParsedTokenAccount, useTokenList, fetchJupiterTokenList } from "@/hooks"
import { fetchPool } from "@/PoolList"

export default function CreatePoolView() {
  const navigate = useNavigate()
  const { connection } = useConnection()
  const publicKey = useWalletAddress()
  const gamba = useGambaProvider()

  const gambaState = useAccount(getGambaStateAddress(), decodeGambaState)
  const [selectedToken, setSelectedToken] = React.useState<ParsedTokenAccount>()
  const tokens = useTokenList()
  const sendTx = useSendTransaction()
  const [isPrivate, setPrivate] = React.useState(false)
  const authority = isPrivate ? publicKey : SYSTEM_PROGRAM
  const selectedPoolId = selectedToken && getPoolAddress(selectedToken.mint, authority)
  const { data: selectedPool, isLoading } = useSWR(
    () => selectedPoolId && "pool-" + selectedPoolId.toBase58(),
    () => selectedPoolId && fetchPool(connection, selectedPoolId),
  )

  const [jupiterTokens, setJupiterTokens] = React.useState([])

  React.useEffect(() => {
    fetchJupiterTokenList()
      .then(setJupiterTokens)
      .catch(console.error)
  }, [])

  // Match user tokens with Jupiter tokens
  const matchedTokens = React.useMemo(() => {
    return tokens.map(token => {
      const jupiterToken = jupiterTokens.find(jt => jt.mint.equals(token.mint))
      return {
        ...token,
        name: jupiterToken?.name || token.name, 
        logo: jupiterToken?.image || token.logo, 
      };
    }).filter(token => token.name)
  }, [tokens, jupiterTokens])
  

  console.log(matchedTokens)
  
  // Sort by 1. Sol, 2. Known tokens 3. Balance 4. Pubkey
  const sortedTokens = React.useMemo(
    () => {
      return tokens
        .sort((a, b) => {
          const nativeMintDiff = Number(isNativeMint(b.mint)) - Number(isNativeMint(a.mint))
          if (nativeMintDiff) return nativeMintDiff
          const aKnown = GAMBA_STANDARD_TOKEN_LIST.some(x => x.mint.equals(a.mint))
          const bKnown = GAMBA_STANDARD_TOKEN_LIST.some(x => x.mint.equals(b.mint))
          const knownDiff = Number(bKnown) - Number(aKnown)
          if (knownDiff) return knownDiff
          const balanceDiff = b.amount - a.amount
          if (balanceDiff) return balanceDiff
          return a.mint.toBase58() > b.mint.toBase58() ? 1 : -1
        })
    },
    [tokens],
  )

  const createPool = async () => {
    try {
      if (!selectedToken) return

      const pool = getPoolAddress(selectedToken.mint, authority)

      const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 })
      const slot = await connection.getSlot()

      const combinedInstructions = [
        modifyComputeUnits,
        ...gamba.createPool(selectedToken.mint, authority, slot),
        // gamba.createPoolLocalnet(selectedToken.mint, authority),
      ]

      await sendTx(
        combinedInstructions,
        { confirmation: "confirmed" },
      )

      navigate("/pool/" + pool.toBase58() + "")
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <>
      <Card style={{ maxWidth: "720px", margin: "0 auto" }} size="4">
        <Flex direction="column" gap="4">
          <Heading>
            Select Token
          </Heading>
          {!gambaState?.poolCreationAllowed && (
            <Callout.Root color="orange">
              <Callout.Icon>
                <ExclamationTriangleIcon />
              </Callout.Icon>
              <Callout.Text>Pool Creation is restricted at the moment. Come back later or select a pool that has already been created.</Callout.Text>
            </Callout.Root>
          )}
          <Text size="2" color="gray">
            Select the token you want to provide liqudity for
          </Text>
          <ScrollArea style={{ maxHeight: "300px" }}>
            <Grid gap="1">
              {matchedTokens.map((token, i) => (
                <div key={i}>
                  <SelectableButton
                    selected={selectedToken?.mint.equals(token.mint)}
                    onClick={() => setSelectedToken(token)}
                  >
                    <TokenItem
                      mint={token.mint}
                      balance={token.amount}
                      name={token.name}
                      logo={token.logo}
                    />
                  </SelectableButton>
                </div>
              ))}
            </Grid>
          </ScrollArea>
          <Flex align="center" justify="between">
            <Text>
              Private
            </Text>
            <Switch radius="full" checked={isPrivate} onCheckedChange={value => setPrivate(value)} />
          </Flex>
          <Dialog.Root>
            <Dialog.Trigger>
              <Button
                size="3"
                color="green"
                variant="soft"
                disabled={!selectedToken || isLoading || !gambaState.poolCreationAllowed || !!selectedPool}
              >
                Create Pool <PlusIcon />
              </Button>
            </Dialog.Trigger>
            <Dialog.Content>
              <Grid gap="2">
                {isPrivate && (
                  <Text>
                    You are about to create a private pool. Please read before doing so.
                  </Text>
                )}
                {!isPrivate && (
                  <Text>
                    You are about to create a public pool. Please read before doing so.
                  </Text>
                )}
                <Callout.Root color="blue">
                  <Callout.Icon>
                    <ExclamationTriangleIcon />
                  </Callout.Icon>
                  <Callout.Text>
                    Note: Creating a pool requires a fee of 1 SOL + rent.
                  </Callout.Text>
                </Callout.Root>
                <Button variant="soft" color="red" onClick={createPool}>
                  I know what I'm doing. Create
                </Button>
              </Grid>
            </Dialog.Content>
          </Dialog.Root>
          {!isLoading && !!selectedPool && (
            <Link
              onClick={() => navigate("/pool/" + selectedPool.publicKey.toBase58())}
            >
              This pool already exists. Go to deposit <ArrowRightIcon />
            </Link>
          )}
        </Flex>
      </Card>
    </>
  )
}
