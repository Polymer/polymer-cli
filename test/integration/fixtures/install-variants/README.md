# install-variants

This test directory includes a bower cache so that offline installs can be run from inside this directory.

If these tests ever fail on install, there is probably a problem with the local cache. Here are some quick instructions for regenerating it:

## Regenerating the Bower Cache

1. Make sure `bower_cache` & `bower-registry` are included in the `.bowerrc` file "storage" config.
2. Remove `bower_cache/` & `bower-registry/` directories.
3. Run `bower install`. Make sure your current working directory is THIS DIRECTORY!
4. If all goes well, `bower install` should correctly regenerate the `bower_cache/` & `bower-registry/` directories.
5. Run `bower install --offline` to confirm.
6. For any new entries to the bower-registry, update the "expires" field to a date far enough in the future that the singularity has almost certainly already happened and polymer-build has been integrated into The Machine.
6. Commit any new files / changes to the cache.