/**
 * Created by mattijsnaus on 1/27/16.
 */
/* globals desc:false, task:true, fail:false, complete:false, jake:false, directory:false */
(function () {
    "use strict";

    var packageJson = require('./package.json');
    var semver = require('semver');
    var minifier = require('minifier');
    var concat = require('concat');
    var jshint = require('simplebuild-jshint');
    var shell = require('shelljs');
    var compressor = require('node-minify');
    var CleanCSS = require('clean-css');

    var DIST_DIR = 'dist/';

    var lintFiles = [
        "Jakefile.js",
        "js/modules/*.js"
    ];

    var lintOptions = {
        bitwise: true,
        eqeqeq: true,
        forin: true,
        freeze: true,
        futurehostile: true,
        newcap: true,
        latedef: 'nofunc',
        noarg: true,
        nocomma: true,
        nonbsp: true,
        nonew: true,
        strict: true,
        undef: true,
        node: true,
        browser: true,
        loopfunc: true,
        laxcomma: true,
        '-W089': false,
        '-W055': false,
        '-W069': false,
        '-W031': false
    };

    var lintGlobals = {
        define: false,
        alert: false,
        confirm: false,
        ace: false,
        $: false,
        jQuery: false
    };

    var requiredJS = [
        {
            files: ['js/vendor/jquery.min.js', 'js/vendor/jquery-ui.min.js', 'js/vendor/flat-ui-pro.min.js', 'js/vendor/chosen.min.js', 'js/vendor/jquery.zoomer.js', 'js/vendor/spectrum.js', 'js/vendor/ace/ace.js', 'js/build/builder.js'],
            output: "dist/js/builder.min.js"
        }
    ];


    //**** Main Jake tasks

    desc("The default build task");
    task("default", [ "nodeversion", "build" ], function () {

        console.log('Build OK');

    });

    desc("The actual build task");
    task("build", [ "linting", "minifyElementJS", "minifyElementCSS", "minifySkeletonCSS", "minifyBuilderCSS", "browserify" ], function () {

        console.log("Building SiteBuilder Lite");

    });


    //**** Supporting Jake tasks

    desc("Check Nodejs version");
    task("nodeversion", function () {

        console.log("Checking Nodejs version: .");

        var requiredVersion = packageJson.engines.node;
        var actualVersion = process.version;

        if( semver.neq(requiredVersion, actualVersion) ) {
            fail("Incorrect Node version; expected " + requiredVersion + " but found " + actualVersion);
        }

    });

    desc("Linting of JS files");
    task("linting", function () {

        process.stdout.write("Linting JS code: ");
        
        jshint.checkFiles({
            files: lintFiles,
            options: lintOptions,
            globals: lintGlobals
        }, complete, fail);

    }, { async: true });

    desc("Compile front-end modules");
    task("browserify", [ DIST_DIR + 'js/' ], function () {

        console.log("Building Javascript code: .");

        shell.rm('-rf', DIST_DIR + "js/*.js");

        var cmds = [
            "node node_modules/browserify/bin/cmd.js js/builder.js --debug -o " + DIST_DIR + "/js/builder.js"
        ];

        //sites.js
        jake.exec(
            cmds, 
            { interactive: true }, 
            function () {
                //jake.Task['minifyMainJS'].invoke();
                complete();
            }
        );        

    }, { async: true });


    desc("Minify elements JS");
    task("minifyElementJS", function () {

        console.log("Minifying elements JS: .");

        minifier.minify(
            ['dist/elements/js/vendor/jquery.min.js', 'dist/elements/js/flat-ui-pro.min.js', 'dist/elements/js/custom.js'],
            {output: 'dist/elements/js/build/build.min.js'}
        );

    });

    desc("Concatenate and minify element CSS");
    task("minifyElementCSS", function () {

        console.log("Concatenating element CSS: .");

        concat([
                'dist/elements/css/vendor/bootstrap.min.css',
                'dist/elements/css/flat-ui-pro.min.css',
                'dist/elements/css/style.css',
                'dist/elements/css/font-awesome.css'
            ],
            'dist/elements/css/build.css',
            function (error) {

                if( error ) {
                    console.log(error);
                } else {
                    console.log("Minifying element CSS: .");
                    minifier.minify('dist/elements/css/build.css', { output: 'dist/elements/css/build.css' });
                }

                complete();

            }
        );

    }, { async: true });

    desc("Concatenate and minify skeleton CSS");
    task("minifySkeletonCSS", function () {

        console.log("Concatenate skeleton CSS: .");

        concat([
                'dist/elements/css/build.css',
                'dist/elements/css/style-contact.css',
                'dist/elements/css/style-content.css',
                'dist/elements/css/style-dividers.css',
                'dist/elements/css/style-footers.css',
                'dist/elements/css/style-headers.css',
                'dist/elements/css/style-portfolios.css',
                'dist/elements/css/style-pricing.css',
                'dist/elements/css/style-team.css',
                'dist/elements/css/nivo-slider.css'
            ],
            'dist/elements/css/skeleton.css',
            function (error) {

                if( error ) {
                    console.log(error);
                } else {
                    console.log("Minifying skeleton CSS: .");
                    minifier.minify('dist/elements/css/skeleton.css', { output: 'dist/elements/css/skeleton.css' });
                }

                complete();

            }
        );

    }, { async: true });

    desc("Concatenate and minify builder CSS");
    task("minifyBuilderCSS", function () {

        console.log("Concatenate builder CSS: .");

        concat([
                'dist/css/vendor/bootstrap.min.css',
                'dist/css/flat-ui-pro.css',
                'dist/css/style.css',
                'dist/css/font-awesome.css',
                'dist/css/builder.css',
                'dist/css/spectrum.css',
                'dist/css/chosen.css'
            ],
            'dist/css/builder.min.css',
            function (error) {

                if( error ) {
                    console.log(error);
                } else {
                    console.log("Minifying builder CSS: .");
                    minifier.minify('dist/css/builder.min.css', { output: 'dist/css/builder.min.css' });
                }

                complete();

            }
        );

    }, { async: true });

    desc("Concatenate and minify builder JS");
    task("minifyMainJS", function (page) {

        console.log("Minifying builder JS: .");

        for( var x = 0; x < requiredJS.length; x++ ) {
            minifier.minify(requiredJS[x].files, {output: requiredJS[x].output});
        }

    });

    desc("Runs a local http server");
    task("run", function () {

        console.log("Serve builder locally:");

        jake.exec("node_modules/.bin/http-server " + DIST_DIR, { interactive: true }, complete);

    }, { async: true });

    directory(DIST_DIR);

}());