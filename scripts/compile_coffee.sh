#!/usr/bin/env bash
# As an alternative to decaffeinate (which results in code changes), this
# script simply compiles our CoffeeScript code to preserve runtime behavior.

target_dir=$1
if [ -z $target_dir ]; then
	echo "Please provide a target directory as the first argument."
	exit 1
fi

# Keep track of modified files for git history.
compiled=()
updated_importers=()

for coffee_path in $(git ls-files $target_dir | grep '\.coffee$'); do
	# Step 1: Rename files to preserve git history, then copy them back for compilation.
	echo "Processing $coffee_path"
	js_path="$(dirname $coffee_path)/$(basename $coffee_path .coffee).js"
	git mv $coffee_path $js_path
	cp $js_path $coffee_path

	# Step 2: Compile the CoffeeScript to update the .js file, lint, then delete the original.
	coffee -c $coffee_path # FIXME: Produces unlinted JS.
	rm $coffee_path
	compiled+=($js_path)
	node node_modules/eslint/bin/eslint.js --fix $js_path 2&>/dev/null # FIXME: Not working.

	# Step 3: Update importers of this file.
	coffee_import=$(basename $coffee_path)
	js_import=$(basename $coffee_import .coffee)
	importers=$(git grep -l $coffee_import | grep '\.js$\|\.coffee$')

	updated_importers+=($importers)
	# TODO: Add GNU sed support (this is BSD sed, sorry!)
	echo $importers | xargs sed -i '' -e "s/\/$coffee_import/\/$js_import/g"
done

# Step 4: Commit renames to preserve history.
git commit -m "Renames ${target_dir} CoffeeScript files to .js"

# Step 5: Commit compilations.
for f in "${compiled[@]}"; do
	git add $f 2>/dev/null
done
git commit -m "Compiles ${target_dir} CoffeeScript into JavaScript"

# Step 6: Commit importer updates.
for f in "${updated_importers[@]}"; do
	git add $f 2>/dev/null
done
git commit -m "Updates importers of ${target_dir} CoffeeScript"
