# Changelog

## [0.2.0](https://github.com/xiaocaishen-michael/no-vain-years-app/compare/v0.1.0...v0.2.0) (2026-05-03)


### Features

* **account:** finish Phase 3 deferred items — typed API + 401 retry + auth guard ([#42](https://github.com/xiaocaishen-michael/no-vain-years-app/issues/42)) ([850da3f](https://github.com/xiaocaishen-michael/no-vain-years-app/commit/850da3ff3a4406887fed436b0e55fac07a3fcabc))
* **api-client,auth:** wire Zustand store + fetch wrapper + Query provider ([#24](https://github.com/xiaocaishen-michael/no-vain-years-app/issues/24)) ([85f943e](https://github.com/xiaocaishen-michael/no-vain-years-app/commit/85f943e4f667660a7292a07cd39e8a6585ab6fae))
* **native:** bootstrap Expo blank-typescript template into apps/native ([#21](https://github.com/xiaocaishen-michael/no-vain-years-app/issues/21)) ([5885363](https://github.com/xiaocaishen-michael/no-vain-years-app/commit/58853632ee1ac1729d9db5d0773b80440e5f076f))
* **native:** wire Expo Router (file-based routing) ([#22](https://github.com/xiaocaishen-michael/no-vain-years-app/issues/22)) ([8b91dc0](https://github.com/xiaocaishen-michael/no-vain-years-app/commit/8b91dc0369a8659a3abea9f94aba6fc1658ed2dd))
* **repo:** migrate Tamagui → NativeWind v4 + design-tokens ([#27](https://github.com/xiaocaishen-michael/no-vain-years-app/issues/27)) ([7942d8e](https://github.com/xiaocaishen-michael/no-vain-years-app/commit/7942d8eb8c05b1afd2ae7e9f797f418085a8f66d))
* **ui:** wire Tamagui provider + design token config ([#23](https://github.com/xiaocaishen-michael/no-vain-years-app/issues/23)) ([7a196da](https://github.com/xiaocaishen-michael/no-vain-years-app/commit/7a196da244551defdca724daf398c75a9d778c1d))


### Bug Fixes

* **repo:** pin tailwindcss to v3.4.x + cleanup remaining Tamagui leftovers ([#28](https://github.com/xiaocaishen-michael/no-vain-years-app/issues/28)) ([403327d](https://github.com/xiaocaishen-michael/no-vain-years-app/commit/403327def54e49938a1052eb26f8fc7ba053714e))


### Maintenance

* **deps-dev:** bump eslint in the lint-tools group ([#31](https://github.com/xiaocaishen-michael/no-vain-years-app/issues/31)) ([371be7d](https://github.com/xiaocaishen-michael/no-vain-years-app/commit/371be7d323647172f4305b7217cb689b4d624687))
* **deps-dev:** bump globals from 17.5.0 to 17.6.0 ([#32](https://github.com/xiaocaishen-michael/no-vain-years-app/issues/32)) ([38825f1](https://github.com/xiaocaishen-michael/no-vain-years-app/commit/38825f1e2191dac4680a7f01c97eeae424bbccbf))
* **deps:** bump @tanstack/react-query ([#41](https://github.com/xiaocaishen-michael/no-vain-years-app/issues/41)) ([b404e9d](https://github.com/xiaocaishen-michael/no-vain-years-app/commit/b404e9d6fdbd6dc582eb084574c6dd3c0fdf99a9))
* **deps:** bump react and @types/react ([#33](https://github.com/xiaocaishen-michael/no-vain-years-app/issues/33)) ([ee1e6e4](https://github.com/xiaocaishen-michael/no-vain-years-app/commit/ee1e6e4bca9487195703c8e8df3b8a1a70a4bff2))
* **deps:** bump react-dom from 19.1.0 to 19.2.5 ([#35](https://github.com/xiaocaishen-michael/no-vain-years-app/issues/35)) ([9ee0d6a](https://github.com/xiaocaishen-michael/no-vain-years-app/commit/9ee0d6abeb20f283f5c245561417cba10c628684))
* **deps:** bump react-hook-form from 7.74.0 to 7.75.0 ([#34](https://github.com/xiaocaishen-michael/no-vain-years-app/issues/34)) ([fd6b518](https://github.com/xiaocaishen-michael/no-vain-years-app/commit/fd6b518cd8aacc2f0c6f14e7dea99513f6cbeed4))
* **deps:** bump zod from 4.4.1 to 4.4.2 ([#36](https://github.com/xiaocaishen-michael/no-vain-years-app/issues/36)) ([a00c8a7](https://github.com/xiaocaishen-michael/no-vain-years-app/commit/a00c8a740d9405ff8fe04aaac044a703dc17aab1))
* **release:** remove release-as bootstrap override ([#19](https://github.com/xiaocaishen-michael/no-vain-years-app/issues/19)) ([4c14a02](https://github.com/xiaocaishen-michael/no-vain-years-app/commit/4c14a02e66b0aa95e18dfecd1265dc68616250ba))
* **repo:** add ESLint flat config + wire lint scripts ([#25](https://github.com/xiaocaishen-michael/no-vain-years-app/issues/25)) ([eaab4e4](https://github.com/xiaocaishen-michael/no-vain-years-app/commit/eaab4e4cb6edc0dc6f4437049aec0a5e7afdbc8f))
* **repo:** bootstrap vitest test infra in apps/native ([#47](https://github.com/xiaocaishen-michael/no-vain-years-app/issues/47)) ([6ff0a5f](https://github.com/xiaocaishen-michael/no-vain-years-app/commit/6ff0a5f244726a0100b9034df57411fcdba35568))
* **repo:** dependabot — broaden expo / RN family semver-major ignore ([#43](https://github.com/xiaocaishen-michael/no-vain-years-app/issues/43)) ([37a93fa](https://github.com/xiaocaishen-michael/no-vain-years-app/commit/37a93fa8a91e3c83c20404c184409062e7560845))
* **repo:** dependabot — ignore expo/tailwindcss major bumps ([#39](https://github.com/xiaocaishen-michael/no-vain-years-app/issues/39)) ([6a42265](https://github.com/xiaocaishen-michael/no-vain-years-app/commit/6a42265421da7d7cd4236d7e8dabf8a0e2ed4b80))
* **repo:** pin react-native minor in dependabot to block out-of-band SDK drift ([#45](https://github.com/xiaocaishen-michael/no-vain-years-app/issues/45)) ([51ccb9b](https://github.com/xiaocaishen-michael/no-vain-years-app/commit/51ccb9b21a2d4d9af4525ff4723794d71eea6df6))
* **repo:** relax commitlint body/footer line length for Dependabot ([#38](https://github.com/xiaocaishen-michael/no-vain-years-app/issues/38)) ([cff52b0](https://github.com/xiaocaishen-michael/no-vain-years-app/commit/cff52b08718c30bdd57d67f352f62aa1e621f812))

## 0.1.0 (2026-05-01)


### Bug Fixes

* **ci:** exclude CHANGELOG.md from prettier (auto-generated by release-please) ([#18](https://github.com/xiaocaishen-michael/no-vain-years-app/issues/18)) ([18dcb3a](https://github.com/xiaocaishen-michael/no-vain-years-app/commit/18dcb3a94ee1eba8e745081e5eec426ab829299e))
* **ci:** pnpm version conflict + release-please PAT fallback ([#13](https://github.com/xiaocaishen-michael/no-vain-years-app/issues/13)) ([3cf949d](https://github.com/xiaocaishen-michael/no-vain-years-app/commit/3cf949d4cc5ba29c28b1b59b3f6148ac11dfdeea))
* **deps:** remove stub peerDependencies from packages/{ui,auth} ([#14](https://github.com/xiaocaishen-michael/no-vain-years-app/issues/14)) ([10894dc](https://github.com/xiaocaishen-michael/no-vain-years-app/commit/10894dc5b24cf980db2527cd340152dbfd601b8f))


### Maintenance

* **deps:** tighten dependabot ignore rules + release-please bootstrap to 0.1.0 ([#16](https://github.com/xiaocaishen-michael/no-vain-years-app/issues/16)) ([caa6d5f](https://github.com/xiaocaishen-michael/no-vain-years-app/commit/caa6d5f4670e76aac967a6b1dcb09ef26d80472b))
* **repo:** add init baseline files (gitignore, editorconfig, security, gitleaks hook) ([#3](https://github.com/xiaocaishen-michael/no-vain-years-app/issues/3)) ([b12adcf](https://github.com/xiaocaishen-michael/no-vain-years-app/commit/b12adcff7a6bdfcacfbe6a342dfb05965119018f))
* **repo:** pnpm workspace scaffold + packages skeleton + dev tooling ([#5](https://github.com/xiaocaishen-michael/no-vain-years-app/issues/5)) ([24e3eb9](https://github.com/xiaocaishen-michael/no-vain-years-app/commit/24e3eb9a5149d80782da8ec7b6c97d095b7ecdae))
