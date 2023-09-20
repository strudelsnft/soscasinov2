import { ClipboardIcon, InfoCircledIcon, PlusCircledIcon } from '@radix-ui/react-icons'
import { Badge, Box, Button, Callout, Card, Container, Flex, Grid, Heading, Link, ScrollArea, Table, Text } from '@radix-ui/themes'
import { lamportsToSol } from 'gamba-core'
import { useEventFetcher } from './useEventFetcher'
import React from 'react'
import { NavLink } from 'react-router-dom'
import { AreaGraph } from './AreaGraph'

const timeAgo = (time: number) => {
  const diff = Date.now() - time
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  if (hours >= 1) {
    return hours + 'h ago'
  }
  if (minutes >= 1) {
    return minutes + 'm ago'
  }
  return 'Just now'
}

function RecentPlays() {
  const [loading, setLoading] = React.useState(false)
  const fetcher = useEventFetcher()
  const initialFetch = React.useRef(false)

  const load = async () => {
    try {
      setLoading(true)
      await fetcher.fetch({ signatureLimit: 40 })
    } finally {
      setLoading(false)
    }
  }

  const results = React.useMemo(
    () => fetcher.transactions.filter((x) => !!x.event.gameResult),
    [fetcher.transactions],
  )

  React.useEffect(
    () => {
      if (initialFetch.current) return
      initialFetch.current = true
      load()
    }
    , [fetcher],
  )

  return (
    <Box my="4">
      <ScrollArea
        type="always"
        scrollbars="vertical"
        style={{
          width: '100%',
          height: 500,
        }}
      >
        <Table.Root variant="surface">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>
              Play
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>
                Payout
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell align="right">
                Time
              </Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {results.map((transaction, i) => {
              const game = transaction.event.gameResult!
              return (
                <Table.Row key={transaction.signature}>
                  <Table.Cell>
                    <Flex align="baseline" gap="2">
                      {1 + i}
                      <Button variant="ghost" size="1">
                        <ClipboardIcon />
                      </Button>
                      <Link asChild>
                        <NavLink to={'/tx/' + transaction.signature}>
                          {transaction.signature.substring(0, 30)}..
                        </NavLink>
                      </Link>
                    </Flex>
                  </Table.Cell>
                  <Table.Cell>
                    <Text mr="2">
                      {parseFloat(lamportsToSol(game.profit).toFixed(3))} SOL
                    </Text>
                    <Badge color={game.profit >= 0 ? 'green' : 'red'}>
                      {game.multiplier >= 1 ? '+' : '-'}
                      {Math.abs(game.multiplier * 100 - 100).toFixed(0)}%
                    </Badge>
                  </Table.Cell>
                  <Table.Cell align="right">
                    <Text>
                      {timeAgo(transaction.time)}
                    </Text>
                  </Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table.Root>
        <Box mt="2">
          <Button
            disabled={loading}
            onClick={load}
            variant="soft"
            style={{ width: '100%' }}
          >
            {fetcher.transactions.length} - Load more <PlusCircledIcon />
          </Button>
        </Box>
      </ScrollArea>
    </Box>
  )
}

export function Dashboard() {
  return (
    <Container>
      <Container mb="4">
        <Callout.Root>
          <Callout.Icon>
            <InfoCircledIcon />
          </Callout.Icon>
          <Callout.Text>
            Data displayed on the dashboard are samples.
          </Callout.Text>
        </Callout.Root>
      </Container>
      <div style={{ height: '250px' }}>
        <AreaGraph />
      </div>
      <Box my="4">
        <Grid
          columns={{ initial: '2', sm: '4' }}
          gap="4"
        >
          <Box>
            <Card size="2">
              <Heading color="orange" size="5">
                Volume
              </Heading>
              <Text size="8" weight="bold">
                -
              </Text>
            </Card>
          </Box>
          <Box>
            <Card size="2">
              <Heading color="orange" size="5">
                Plays
              </Heading>
              <Text size="8" weight="bold">
                -
              </Text>
            </Card>
          </Box>
          <Box>
            <Card size="2">
              <Heading color="orange" size="5">
                Players
              </Heading>
              <Text size="8" weight="bold">
                -
              </Text>
            </Card>
          </Box>
          <Box grow="1">
            <Card size="2">
              <Heading color="orange" size="5">
                Creators
              </Heading>
              <Text size="8" weight="bold">
                -
              </Text>
            </Card>
          </Box>
        </Grid>
      </Box>

      {/* <Grid
        columns={{ sm: '2' }}
        gap="4"
      >
        <Box>
          <Table.Root variant="surface">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>
                  Creator
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="right">
                  Volume
                </Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>

              {CREATORS.map(({ address, meta, volume }, i) => (
                <Table.Row key={i}>
                  <Table.Cell>
                    <Flex align="baseline" gap="2">
                      <Button variant="ghost" size="1">
                        <ClipboardIcon />
                      </Button>
                      <Link asChild>
                        <NavLink to={'/address/' + address}>
                          {meta?.name ?? (address.substring(0, 24) + '...')}
                        </NavLink>
                      </Link>
                    </Flex>
                  </Table.Cell>
                  <Table.Cell align="right">
                    <Text>
                      {volume.toLocaleString()} SOL
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>

        <Box>
          <Table.Root variant="surface">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>
                  Play
                </Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="right">
                  Payout
                </Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {[...PLAYS].sort((a, b) => b.multiplier - a.multiplier).slice(0, 4).map(({ txid, profit, multiplier }, i) => (
                <Table.Row key={i}>
                  <Table.Cell>
                    <Flex align="baseline" gap="2">
                      <Button variant="ghost" size="1">
                        <ClipboardIcon />
                      </Button>

                      <Link asChild>
                        <NavLink to={'/tx/' + txid}>
                          {txid.substring(0, 20)}...
                        </NavLink>
                      </Link>
                    </Flex>
                  </Table.Cell>
                  <Table.Cell align="right">
                    <Text mr="2">
                      {Math.abs(profit).toFixed(3).toLocaleString()} SOL
                    </Text>
                    <Badge color={profit >= 0 ? 'green' : 'red'}>
                      {multiplier >= 1 ? '+' : '-'}
                      {Math.abs(multiplier * 100 - 100).toFixed(0)}%
                    </Badge>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      </Grid> */}

      <RecentPlays />
    </Container>
  )
}
