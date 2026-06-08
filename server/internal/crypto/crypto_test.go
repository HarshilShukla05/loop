package crypto

import (
	"crypto/rand"
	"encoding/base64"
	"io"
	"testing"
)

func keyBase64(t *testing.T) string {
	t.Helper()
	key := make([]byte, 32)
	if _, err := io.ReadFull(rand.Reader, key); err != nil {
		t.Fatal(err)
	}
	return base64.StdEncoding.EncodeToString(key)
}

func TestEncryptDecryptRoundTrip(t *testing.T) {
	c, err := New(keyBase64(t))
	if err != nil {
		t.Fatal(err)
	}
	secret := "IGQVJ...long-lived-token"

	encoded, err := c.Encrypt(secret)
	if err != nil {
		t.Fatal(err)
	}
	if encoded == secret {
		t.Fatal("ciphertext equals plaintext")
	}

	got, err := c.Decrypt(encoded)
	if err != nil {
		t.Fatal(err)
	}
	if got != secret {
		t.Fatalf("got %q, want %q", got, secret)
	}
}

func TestDecryptWithWrongKeyFails(t *testing.T) {
	enc, _ := New(keyBase64(t))
	encoded, _ := enc.Encrypt("token")

	other, _ := New(keyBase64(t))
	if _, err := other.Decrypt(encoded); err == nil {
		t.Fatal("expected error decrypting with a different key")
	}
}

func TestDecryptTamperedFails(t *testing.T) {
	c, _ := New(keyBase64(t))
	encoded, _ := c.Encrypt("token")

	raw, _ := base64.StdEncoding.DecodeString(encoded)
	raw[len(raw)-1] ^= 0xff
	tampered := base64.StdEncoding.EncodeToString(raw)

	if _, err := c.Decrypt(tampered); err == nil {
		t.Fatal("expected error decrypting tampered ciphertext")
	}
}

func TestNewRejectsBadKey(t *testing.T) {
	if _, err := New(base64.StdEncoding.EncodeToString([]byte("too-short"))); err == nil {
		t.Fatal("expected error for short key")
	}
}
