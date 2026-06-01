#!/bin/bash

for f in *.jpg; do
    convert "$f" -resize 632x387\! "$f"
done
