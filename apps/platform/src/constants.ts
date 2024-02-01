import { GambaStandardTokens, TokenMeta } from 'gamba-react-ui-v2'

export const PLATFORM_CREATOR_ADDRESS = 'HBQpKxK2Wdscn4kEBZWyXQ2GuCAEVeH6yinVnc736MVL'

/** Appears in ShareModal */
export const PLATFORM_SHARABLE_URL = 'v2-play.gamba.so'

// List of tokens supported by this platform
export const TOKENS: TokenMeta[] = [
  GambaStandardTokens.sol,
  GambaStandardTokens.usdc,
]
