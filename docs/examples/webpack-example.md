# Webpack Example

This is a simple Webpack example demonstrating how to bundle JavaScript and CSS files.

## 📌 Prerequisites
- Ensure you have [pnpm](https://pnpm.io/) installed.
- Node.js (v16 or later is recommended)

## 🚀 Installation
Clone the repository and navigate to the example directory:

```sh
cd examples/webpack-example
```

Install the required dependencies:
```sh
pnpm install
```

## 🛠 Running the Development Server
To start the local Webpack development server:
```sh
pnpm start
```

This will open `http://localhost:3000/` in your browser.

## 📦 Building for Production
To generate an optimized production build:
```sh
pnpm build
```



## 📂 Project Structure

```
webpack-example/
├── src/
│   ├── index.js          # Entry file
│   ├── styles.css        # Basic styling
├── public/
│   ├── index.html        # HTML template              
├── webpack.config.js      # Webpack configuration
├── package.json          # Project metadata
├── .gitignore            # Ignore node_modules & dist
```

## ⚙️ Webpack Configuration
The `webpack.config.js` includes:
- **Entry point:** `src/index.js`
- **CSS Support:** via `style-loader` and `css-loader`
- **HTML Template:** via `html-webpack-plugin`
- **Development Server:** with live reload

## 📝 Notes
- If you encounter a `style-loader` error, install missing loaders:
  ```sh
  pnpm add --save-dev style-loader css-loader
  ```
- Ensure you are running `pnpm install` before starting the project.

This example serves as a foundation for building Webpack-based applications. 🚀