// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract VerifiableCredential is ERC721URIStorage, AccessControl {
    uint256 private _nextTokenId;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    mapping(uint256 => bool) private _revoked;

    event CredentialIssued(
        uint256 indexed tokenId,
        address indexed to,
        string tokenURI
    );
    event CredentialRevoked(uint256 indexed tokenId);

    constructor() ERC721("Verifiable Credential", "VCD") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _nextTokenId = 1;
    }

    function issueCredential(
        address to,
        string memory _tokenURI
    ) external onlyRole(MINTER_ROLE) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        emit CredentialIssued(tokenId, to, _tokenURI);
    }

    // SBT Logic: Override _update to prevent transfers (OpenZeppelin v5)
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);

        // Only allow minting (from == address(0)) - block all transfers
        if (from != address(0) && to != address(0)) {
            revert("Soulbound: Tokens are non-transferable");
        }

        return super._update(to, tokenId, auth);
    }

    function revoke(uint256 tokenId) external onlyRole(MINTER_ROLE) {
        _requireOwned(tokenId); // OpenZeppelin v5 way to check if token exists
        _revoked[tokenId] = true;
        emit CredentialRevoked(tokenId);
    }

    function isRevoked(uint256 tokenId) external view returns (bool) {
        return _revoked[tokenId];
    }

    // Required for multiple inheritance
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(AccessControl, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // Helper function to get total supply
    function totalSupply() public view returns (uint256) {
        return _nextTokenId - 1;
    }

    // Optional: Add getter for next token ID
    function getNextTokenId() public view returns (uint256) {
        return _nextTokenId;
    }
}
