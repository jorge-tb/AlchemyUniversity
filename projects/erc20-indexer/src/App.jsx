import {
  Avatar,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Input,
  InputGroup,
  InputRightElement,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Alchemy, Network, Utils } from 'alchemy-sdk';
import { useState } from 'react';
import { WalletButton } from './components/WalletButton';

// Format a raw balance to something human-readable: trim to 4 decimals,
// drop trailing zeros, and fall back gracefully when decimals are missing.
function formatBalance(raw, decimals) {
  try {
    const value = Number(Utils.formatUnits(raw, decimals ?? 18));
    if (value === 0) return '0';
    if (value < 0.0001) return '<0.0001';
    return value.toLocaleString(undefined, { maximumFractionDigits: 4 });
  } catch {
    return '—';
  }
}

function App() {
  const [userAddress, setUserAddress] = useState('');
  const [results, setResults] = useState([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [tokenDataObjects, setTokenDataObjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function getTokenBalance() {
    if (!userAddress.trim()) return;
    setIsLoading(true);
    setError('');
    try {
      const config = {
        apiKey: import.meta.env.VITE_ALCHEMY_API_KEY,
        network: Network.ETH_MAINNET,
      };

      const alchemy = new Alchemy(config);
      const data = await alchemy.core.getTokenBalances(userAddress);
      setResults(data);

      const tokenDataPromises = data.tokenBalances.map((t) =>
        alchemy.core.getTokenMetadata(t.contractAddress)
      );

      setTokenDataObjects(await Promise.all(tokenDataPromises));
      setHasQueried(true);
    } catch (e) {
      setError(e?.message ?? 'Something went wrong fetching balances.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Box minH="100vh">
      {/* Top bar */}
      <Flex
        as="header"
        justify="space-between"
        align="center"
        px={{ base: 5, md: 10 }}
        py={5}
      >
        <HStack spacing={3}>
          <Box
            w={9}
            h={9}
            borderRadius="lg"
            bgGradient="linear(to-br, accent.from, accent.to)"
          />
          <Text fontWeight={700} letterSpacing="-0.02em">
            Indexer
          </Text>
        </HStack>
        <WalletButton />
      </Flex>

      <Container maxW="6xl" pt={{ base: 8, md: 16 }} pb={24}>
        {/* Hero */}
        <VStack spacing={4} textAlign="center" mb={12}>
          <Text
            fontSize="sm"
            fontWeight={600}
            letterSpacing="0.15em"
            textTransform="uppercase"
            color="whiteAlpha.500"
          >
            Ethereum Mainnet
          </Text>
          <Heading
            fontSize={{ base: '4xl', md: '6xl' }}
            fontWeight={800}
            letterSpacing="-0.03em"
            lineHeight={1.05}
            bgGradient="linear(to-r, white, whiteAlpha.700)"
            bgClip="text"
          >
            ERC-20 Token{' '}
            <Box
              as="span"
              bgGradient="linear(to-r, accent.from, accent.to)"
              bgClip="text"
            >
              Indexer
            </Box>
          </Heading>
          <Text fontSize={{ base: 'md', md: 'lg' }} color="whiteAlpha.600" maxW="lg">
            Paste any wallet address and instantly surface every ERC-20 balance
            it holds.
          </Text>
        </VStack>

        {/* Search panel */}
        <Box
          maxW="2xl"
          mx="auto"
          p={{ base: 5, md: 6 }}
          borderRadius="2xl"
          bg="surface.card"
          border="1px solid"
          borderColor="surface.border"
          backdropFilter="blur(12px)"
          boxShadow="0 20px 60px -30px rgba(0,0,0,0.8)"
        >
          <InputGroup size="lg">
            <Input
              value={userAddress}
              onChange={(e) => setUserAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && getTokenBalance()}
              placeholder="0x… or ENS-resolved address"
              fontFamily="mono"
              fontSize="md"
              bg="blackAlpha.400"
              border="1px solid"
              borderColor="surface.border"
              borderRadius="xl"
              pr="7.5rem"
              _placeholder={{ color: 'whiteAlpha.400' }}
              _hover={{ borderColor: 'whiteAlpha.300' }}
              _focusVisible={{
                borderColor: 'accent.from',
                boxShadow: '0 0 0 1px #7c3aed',
              }}
            />
            <InputRightElement width="7rem" pr={1}>
              <Button
                variant="gradient"
                size="sm"
                w="full"
                onClick={getTokenBalance}
                isLoading={isLoading}
                loadingText="…"
              >
                Scan
              </Button>
            </InputRightElement>
          </InputGroup>

          {error && (
            <Text mt={3} fontSize="sm" color="red.300">
              {error}
            </Text>
          )}
        </Box>

        {/* Results */}
        <Box mt={16}>
          {isLoading ? (
            <VStack spacing={4} color="whiteAlpha.600" py={16}>
              <Spinner size="lg" thickness="3px" color="accent.to" speed="0.7s" />
              <Text>Reading the chain…</Text>
            </VStack>
          ) : hasQueried ? (
            <>
              <Flex align="baseline" justify="space-between" mb={6} px={1}>
                <Heading fontSize="xl" fontWeight={700}>
                  Balances
                </Heading>
                <Text fontSize="sm" color="whiteAlpha.500">
                  {results.tokenBalances.length} tokens
                </Text>
              </Flex>
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={5}>
                {results.tokenBalances.map((e, i) => {
                  const meta = tokenDataObjects[i] ?? {};
                  return (
                    <Box
                      key={e.contractAddress}
                      p={5}
                      borderRadius="2xl"
                      bg="surface.card"
                      border="1px solid"
                      borderColor="surface.border"
                      backdropFilter="blur(12px)"
                      transition="all 0.2s ease"
                      _hover={{
                        transform: 'translateY(-4px)',
                        borderColor: 'whiteAlpha.300',
                        boxShadow: '0 20px 40px -24px rgba(124,58,237,0.7)',
                      }}
                    >
                      <HStack spacing={3} mb={4}>
                        <Avatar
                          size="sm"
                          name={meta.symbol || '?'}
                          src={meta.logo || undefined}
                          bgGradient="linear(to-br, accent.from, accent.to)"
                          color="white"
                        />
                        <Box overflow="hidden">
                          <Text fontWeight={700} noOfLines={1}>
                            {meta.symbol || 'Unknown'}
                          </Text>
                          <Text
                            fontSize="xs"
                            color="whiteAlpha.500"
                            noOfLines={1}
                          >
                            {meta.name || 'Unnamed token'}
                          </Text>
                        </Box>
                      </HStack>
                      <Text
                        fontFamily="mono"
                        fontSize="lg"
                        fontWeight={600}
                        letterSpacing="-0.01em"
                        noOfLines={1}
                      >
                        {formatBalance(e.tokenBalance, meta.decimals)}
                      </Text>
                    </Box>
                  );
                })}
              </SimpleGrid>
            </>
          ) : (
            <VStack spacing={2} color="whiteAlpha.400" py={16}>
              <Text fontSize="2xl">🔎</Text>
              <Text>Enter an address above to get started.</Text>
            </VStack>
          )}
        </Box>
      </Container>
    </Box>
  );
}

export default App;
