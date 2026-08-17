.PHONY: install dev test lint check release-check

install:
	npm ci

dev:
	npm run dev

test:
	npm test

lint:
	npm run lint

check:
	npm run check

release-check:
	npm run release:check -- --audit
