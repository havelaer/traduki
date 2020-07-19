# Lazy Lion

## ⚠️ WORK IN PROGRESS ⚠️

*Lazy Lion is a set of build- and runtime tools for lazy loading L10n messages.*

It is inspired by the mechanisms of CSS Modules: Modular / locally scoped translation files which are bundled and precompiled per locale for production.

When importing the messages YAML from a JS Module, it exports an object with all mappings from local message keys to global message keys. As side effect it registers the location of the bundled (global) messages file for each locale.

This even works when the application is split in different chunks. For each chunk messages files are bundled per locale.

You can use toe power of [MessageFormat](https://www.npmjs.com/package/messageformat) for text formatting in the messages files.

The tooling is build for [Rollup](https://rollupjs.org/guide/en/).

### Example setup

```yaml
# a.messages.yaml
en:
    hello: Hello {name}!
    intro: How are you?
nl:
    hello: Hallo {name}!
    intro: Hoe is het met jou?
```

```yaml
# b.messages.yaml
en:
    hello: Hey!
    example: We have {p, number, percent} code coverage.
nl:
    hello: Hoi!
    example: We hebben {p, number, percent} code dekking.
```

```js
// index.js
import Lion from '@lazy-lion/runtime'
import messagesA from 'a.messages.yaml'
import messagesB from 'b.messages.yaml'

console.log(messagesA); // { hello: 'hello_30ebe736', intro: 'intro_01b95038' }
console.log(messagesB); // { hello: 'hello_1f4f2d72', example: 'example_5bb0d8fb' }

(async () => {
  await Lion.setLocale('en').load();
  Lion.translate(messagesA.hello, { name: 'John' }); // "Hello John!"
})
```

### Example production build

A production build wil result in a compiled `index.js`, a precompiled messages file for english `index.en.js` and a precompiled dutch messages file `index.nl.js`.

During runtime the correct locale can be loaded.

```js
// index.en.js
// precompiled bundled messageformat messages javascript file for english
// (also support for commonjs)
export default {
  hello_30ebe736: function(d) { return "Hello " + d.name + "!"; },
  intro_01b95038: function(d) { return "How are you?"; },
  hello_1f4f2d72: function(d) { return "Hey!"; },
  example_5bb0d8fb: function(d) { return "We have " + fmt.number(d.p, "en", (" percent").trim()) + " code coverage."; }
}
```

## Getting started

### Install

```bash
npm install --save-dev @lazy-lion/rollup-plugin
npm install @lazy-lion/runtime
```

### Usage

Create a rollup.config.js configuration file and import the plugin:

```js
import lazyLionPlugin from '@lazy-lion/rollup-plugin';

module.exports = {
  input: 'src/index.js',
  output: {
    dir: 'output',
    format: 'cjs'
  },
  plugins: [
    lazyLionPlugin()
  ]
};
```

### Options

TODO