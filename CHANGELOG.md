# Changelog

All notable changes to the project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.5.0] - TBD

### Changed

- Use of the `override` keyword is now required when overriding a parent class' property. This feature
  can be disabled by setting `build.features.requireExplicitOverride` to `false`.

## [0.4.0] - 2021-07-11

### Added

- Opt-in feature flag to require use of the `override` keyword when overriding a parent class' property.
  This option will be enabled by default in version 0.5.0.

### Changed

- Generated configuration files are now created directly at the source instead of in `.batterypack`.

### Removed

- `useLegacyModules` flag in `batterypack.yml`.
