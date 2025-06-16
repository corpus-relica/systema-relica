#!/bin/bash

# Replace with the path to your Conda setup script and the name of your environment
CONDA_PATH=~/miniconda3/etc/profile.d/conda.sh
ENV_NAME=relica_nous

# Activate Conda environment
source $CONDA_PATH
conda activate $ENV_NAME

# Watch for changes in Python files and restart the application
watchmedo auto-restart --directory=./ --pattern=*.py --recursive -- python main.py
