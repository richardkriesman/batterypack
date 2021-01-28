<!--suppress ALL -->
<h1 align="center">
    batterypack
</h1>

<p align="center">
    An opinionated, "batteries included" project management and build tool for Node and TypeScript.
</p>

<p align="center">
    <a href="https://www.repostatus.org/#wip">
        <img 
            src="https://www.repostatus.org/badges/latest/wip.svg"
            alt="Project Status: WIP – Initial development is in progress, but there has not yet been a stable, usable release suitable for the public."
        />
    </a>
</p>

---

batterypack is an opinionated project manager and build tool for Node.js projects. It leverages a number of popular
development tools to make it faster and easier to start writing clean, maintainable code:

- batterypack projects use TypeScript, pre-configured with best-practice options
- batterypack catches circular dependencies in your code, encouraging clean composition and reducing obscure
  import-related issues
- batterypack supports absolute imports out-of-the-box, changing them to relative paths during compilation
- batterypack formats your source code using [Prettier](https://prettier.io), a popular automatic code formatter,
  so you can end bikeshedding arguments among your team
- batterypack unifies your project's configuration, deriving configuration files for other tools from a single source
- batterypack supports subprojects, enabling you to quickly build and manage monorepos

Some other things that are still in the pipeline:

- Testing with Jest
- Incremental builds

### Development status

batterypack is a new project and very much a Work In Progress (WIP). You can use it if you want,
but it is _not_ currently mature enough that production use can be recommended.
