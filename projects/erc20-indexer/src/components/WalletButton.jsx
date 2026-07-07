import { Box, Button, HStack, Text } from "@chakra-ui/react";
import { useWallet } from "../useWallet";

export function WalletButton() {
  const { account, chainId, connect } = useWallet();

  if (account) {
    return (
      <HStack
        spacing={2.5}
        px={4}
        py={2}
        borderRadius="full"
        bg="surface.card"
        border="1px solid"
        borderColor="surface.border"
        backdropFilter="blur(8px)"
      >
        <Box
          w={2}
          h={2}
          borderRadius="full"
          bg="green.400"
          boxShadow="0 0 10px #34d399"
        />
        <Text fontFamily="mono" fontSize="sm" fontWeight={500}>
          {account.slice(0, 6)}…{account.slice(-4)}
        </Text>
        <Text fontSize="xs" color="whiteAlpha.500">
          chain {chainId}
        </Text>
      </HStack>
    );
  }

  return (
    <Button variant="gradient" size="md" onClick={connect}>
      Connect MetaMask
    </Button>
  );
}
