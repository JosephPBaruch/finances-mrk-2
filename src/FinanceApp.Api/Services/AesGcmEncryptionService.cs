using System.Security.Cryptography;
using System.Text;
using FinanceApp.Api.Configuration;
using Microsoft.Extensions.Options;

namespace FinanceApp.Api.Services;

public sealed class AesGcmEncryptionService(IOptions<EncryptionOptions> options) : IEncryptionService
{
    private const int NonceSize = 12;
    private const int TagSize = 16;
    private readonly string _configuredKey = options.Value.Key;

    public string Encrypt(string plaintext)
    {
        var key = GetKey();
        var nonce = RandomNumberGenerator.GetBytes(NonceSize);
        var plaintextBytes = Encoding.UTF8.GetBytes(plaintext);
        var ciphertext = new byte[plaintextBytes.Length];
        var tag = new byte[TagSize];
        using var aes = new AesGcm(key, TagSize);
        aes.Encrypt(nonce, plaintextBytes, ciphertext, tag);

        var payload = new byte[1 + NonceSize + TagSize + ciphertext.Length];
        payload[0] = 1;
        Buffer.BlockCopy(nonce, 0, payload, 1, nonce.Length);
        Buffer.BlockCopy(tag, 0, payload, 1 + nonce.Length, tag.Length);
        Buffer.BlockCopy(ciphertext, 0, payload, 1 + nonce.Length + tag.Length, ciphertext.Length);
        return Convert.ToBase64String(payload);
    }

    public string Decrypt(string ciphertext)
    {
        var payload = Convert.FromBase64String(ciphertext);
        if (payload.Length < 1 + NonceSize + TagSize || payload[0] != 1)
            throw new CryptographicException("Unsupported encrypted payload.");

        var nonce = payload.AsSpan(1, NonceSize);
        var tag = payload.AsSpan(1 + NonceSize, TagSize);
        var encrypted = payload.AsSpan(1 + NonceSize + TagSize);
        var plaintext = new byte[encrypted.Length];
        using var aes = new AesGcm(GetKey(), TagSize);
        aes.Decrypt(nonce, encrypted, tag, plaintext);
        return Encoding.UTF8.GetString(plaintext);
    }

    private byte[] GetKey()
    {
        if (string.IsNullOrWhiteSpace(_configuredKey))
            throw new InvalidOperationException("Encryption:Key is not configured.");
        try
        {
            var key = Convert.FromBase64String(_configuredKey);
            if (key.Length != 32) throw new FormatException();
            return key;
        }
        catch (FormatException)
        {
            throw new InvalidOperationException("Encryption:Key must be a Base64-encoded 32-byte key.");
        }
    }
}
