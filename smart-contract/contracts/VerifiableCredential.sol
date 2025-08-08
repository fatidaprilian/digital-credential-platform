// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title VerifiableCredential
 * @dev ERC721 token contract for non-transferable, soul-bound credentials.
 * Implements batch minting and role-based access control.
 */
contract VerifiableCredential is ERC721URIStorage, AccessControl {
    uint256 private _nextTokenId;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    mapping(uint256 => bool) private _revoked;

    // --- Events ---
    event CredentialIssued(
        uint256 indexed tokenId,
        address indexed to,
        string tokenURI
    );
    event CredentialRevoked(uint256 indexed tokenId);
    event CredentialBatchIssued(
        uint256 fromTokenId,
        uint256 toTokenId,
        address indexed issuer
    );

    /**
     * @dev Sets up the contract, granting the deployer admin and minter roles.
     */
    constructor() ERC721("Verifiable Credential", "VCD") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender); // Grant deployer minter role by default
        _nextTokenId = 1;
    }

    /**
     * @dev Issues a single credential to a recipient.
     * Can only be called by an account with MINTER_ROLE.
     */
    function issueCredential(
        address to,
        string memory _tokenURI
    ) external onlyRole(MINTER_ROLE) {
        _issueCredential(to, _tokenURI);
    }

    /**
     * @dev Issues multiple credentials in a single transaction.
     * Can only be called by an account with MINTER_ROLE.
     * @param _recipients Array of recipient wallet addresses.
     * @param _tokenURIs Array of metadata URIs for each credential.
     */
    function issueCredentialBatch(
        address[] calldata _recipients,
        string[] calldata _tokenURIs
    ) public onlyRole(MINTER_ROLE) {
        require(
            _recipients.length == _tokenURIs.length,
            "BatchMint: Array lengths must match"
        );
        require(
            _recipients.length > 0,
            "BatchMint: Cannot process an empty batch"
        );

        uint256 startTokenId = _nextTokenId;
        for (uint256 i = 0; i < _recipients.length; i++) {
            _issueCredential(_recipients[i], _tokenURIs[i]);
        }
        uint256 endTokenId = _nextTokenId - 1;

        emit CredentialBatchIssued(startTokenId, endTokenId, msg.sender);
    }

    /**
     * @dev Internal core logic for minting a single credential.
     * This is called by both `issueCredential` and `issueCredentialBatch`.
     */
    function _issueCredential(address to, string memory _tokenURI) internal {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        emit CredentialIssued(tokenId, to, _tokenURI);
    }

    /**
     * @dev Overrides the default _update hook to enforce non-transferability (Soulbound).
     * This allows minting (from address(0)) but blocks transfers between accounts.
     */
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

    /**
     * @dev Revokes a credential, marking it as invalid.
     * Can only be called by an account with MINTER_ROLE.
     */
    function revoke(uint256 tokenId) external onlyRole(MINTER_ROLE) {
        _requireOwned(tokenId); // OpenZeppelin v5 check if token exists and is owned
        _revoked[tokenId] = true;
        emit CredentialRevoked(tokenId);
    }

    /**
     * @dev Checks if a credential has been revoked.
     */
    function isRevoked(uint256 tokenId) external view returns (bool) {
        return _revoked[tokenId];
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(AccessControl, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Returns the total number of credentials issued.
     */
    function totalSupply() public view returns (uint256) {
        return _nextTokenId - 1;
    }

    /**
     * @dev Returns the ID of the next token to be minted.
     */
    function getNextTokenId() public view returns (uint256) {
        return _nextTokenId;
    }
}
