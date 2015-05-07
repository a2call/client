package libkb

import (
	triplesec "github.com/keybase/go-triplesec"
)

type StreamCache struct {
	tsec             *triplesec.Cipher
	passphraseStream PassphraseStream
}

func NewStreamCache(tsec *triplesec.Cipher, ps PassphraseStream) *StreamCache {
	return &StreamCache{
		tsec:             tsec,
		passphraseStream: ps,
	}
}

func (s *StreamCache) Triplesec() *triplesec.Cipher {
	if s == nil {
		return nil
	}
	return s.tsec
}

func (s *StreamCache) PassphraseStream() PassphraseStream {
	if s == nil {
		return nil
	}
	return s.passphraseStream
}

func (s *StreamCache) Valid() bool {
	if s == nil {
		return false
	}
	return s.tsec != nil && s.passphraseStream != nil
}

func (s *StreamCache) Clear() {
	if s == nil {
		return
	}
	s.tsec.Scrub()
	s.tsec = nil
	s.passphraseStream = nil
}
