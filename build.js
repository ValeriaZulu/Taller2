import esbuild from "esbuild"
import fs from "fs"
import { minify } from "html-minifier-terser"
import imagemin from "imagemin";
import imageminMozjpeg from "imagemin-mozjpeg"
import imageminPngquant from "imagemin-pngquant"
import imageminSvgo from "imagemin-svgo";
import { copy } from "esbuild-plugin-copy"
import { sassPlugin } from "esbuild-sass-plugin"

// Función para optimizar imágenes
async function optimizeImages() {
    try {
        await imagemin(['docs/assets/images/*.{jpg,png,gif,svg}'], {
            destination: 'dist/assets/images',
            plugins: [
                imageminMozjpeg({ quality: 80 }),
                imageminPngquant({ quality: [0.6, 0.8] }),
                imageminSvgo({ plugins: [{ removeViewBox: false }] })
            ]
        });
        console.log('Imágenes optimizadas y copiadas');
    } catch (error) {
        console.error('Error optimizando imágenes:', error);
    }
}

// Función para minificar HTML
async function minifyHTML(sourcePath, destinationPath) {
    try {
        const html = fs.readFileSync(sourcePath, 'utf8');
        const minifiedHtml = await minify(html, {
            collapseWhitespace: true,
            removeComments: true,
            removeRedundantAttributes: true,
            removeEmptyAttributes: true,
            minifyCSS: true,
            minifyJS: true
        });
        fs.writeFileSync(destinationPath, minifiedHtml, 'utf8');
        console.log(`Minificado: ${destinationPath}`);
    } catch (error) {
        console.error(`Error minificando ${sourcePath}:`, error);
    }
}



// Ejecutar esbuild con soporte para SASS
esbuild.build({
    entryPoints: ['docs/scripts/main.js', 'docs/styles/styles.scss', 'docs/styles/dark.scss'],
    bundle: true,
    minify: true,
    outdir: 'dist',
    sourcemap: false,
    platform: 'browser',
    format: 'iife',
    target: ['es6'],
    loader: {
        '.png': 'file',
        '.jpg': 'file',
        '.gif': 'file',
        '.svg': 'file'
    },
    define: { 'process.env.NODE_ENV': '"production"' },
    plugins: [
        sassPlugin(),
        copy({
            resolveFrom: 'cwd',
            assets: {
                from: ['./docs/assets/**/*'],
                to: ['./dist/assets']
            }
        })
    ]
}).then(() => {
    console.log('⚡ Build completo con soporte para SASS');
    // Minificar archivos HTML
    const htmlFiles = ['index.html', 'formulario.html', 'login.html', 'signin.html'];
    htmlFiles.forEach(file => {
        minifyHTML(`docs/${file}`, `dist/${file}`);
    });
    return optimizeImages();


}).catch(() => process.exit(1));
