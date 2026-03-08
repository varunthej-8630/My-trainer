MY_TRAINER

Custom Dataset & Model Builder for CUSTOS

Developed by Varunthej Parimi

PROJECT OVERVIEW

<img width="1905" height="1017" alt="image" src="https://github.com/user-attachments/assets/631d84fb-bb2b-44de-b08f-d1ad55b8e08e" />

<img width="1917" height="1024" alt="image" src="https://github.com/user-attachments/assets/43efc746-e09e-48ae-9b4e-4a3ed2c750d5" />

<img width="1916" height="1021" alt="image" src="https://github.com/user-attachments/assets/19eabb38-2791-4127-8923-6bfbb072816e" />

<img width="1912" height="1000" alt="image" src="https://github.com/user-attachments/assets/659b97ee-b316-4c05-b130-de82a4e4eeaf" />

<img width="1917" height="1019" alt="image" src="https://github.com/user-attachments/assets/0fb912b5-f17e-464a-a966-496b4298f79d" />

<img width="1919" height="1010" alt="image" src="https://github.com/user-attachments/assets/5c17b5ae-03b1-4103-b1b6-6cff4c650759" />


MY_TRAINER is a browser-based tool built to simplify the process of creating custom datasets and training machine learning models.

The tool was designed specifically to support the development of the CUSTOS Guardian Intelligence System by allowing fast experimentation with AI training data.

Instead of manually collecting and preparing datasets using multiple tools, MY_TRAINER provides a single interface to:

• Collect training samples
• Label data
• Generate structured datasets
• Train neural network models
• Export trained models for integration

This allows faster iteration while developing AI features for CUSTOS.

PROJECT STRUCTURE

MY_TRAINER/

trainer.html
Main user interface and layout

trainer.css
Visual design and styling

trainer.js
Core logic for dataset collection and training

README.md
Project documentation

CORE CAPABILITIES

Dataset Creation

The system allows collecting structured training samples directly from multiple media sources.

Supported inputs include:

Webcam capture
Image uploads
Video files
Animated GIF sequences

Each collected sample can be labeled and stored as part of a dataset.

Model Training

The tool allows training a neural network directly inside the browser using TensorFlow.js.

The training pipeline includes:

Feature extraction
Data labeling
Dataset preparation
Neural network training
Real-time testing

This enables quick experimentation without needing a backend server.

Model Export

After training, the system can export multiple files:

dataset.json
Complete dataset with labels and metadata

dataset.csv
Structured dataset that can be opened in Excel or other analysis tools

model.json
Neural network architecture

model.weights.bin
Trained model weights

These exported models can later be integrated into the CUSTOS AI system.

TECHNOLOGY STACK

HTML

Defines the structure of the application interface including panels, controls, and display components.

CSS

Handles layout, styling, animations, and visual feedback across the application.

JavaScript

Implements the core logic including data processing, user interactions, model training, and export functions.

TensorFlow.js

Provides the machine learning framework used to train neural networks directly inside the browser.

MediaPipe

Used for extracting pose and hand landmark features from visual inputs which serve as training data for the neural network.

HOW TO RUN THE PROJECT

Step 1 — Install Node.js

Download and install the LTS version from

https://nodejs.org

Verify installation

node --version
npm --version

Step 2 — Install live-server

Open the VS Code terminal and run

npm install -g live-server

Step 3 — Navigate to the project folder

Example

cd D:\my_trainer

Step 4 — Start the local server

live-server --open=trainer.html

This will start a development server and automatically open the application in your browser.

Example server address

http://127.0.0.1:8080

Alternative method using Python

python -m http.server 8080

Then open

http://localhost:8080/trainer.html

WHY A LOCAL SERVER IS REQUIRED

Modern browsers restrict camera access and certain JavaScript features when running files directly using file://.

Running the project through a local server enables:

Camera permissions
JavaScript modules
External libraries

ROLE IN THE CUSTOS ECOSYSTEM

MY_TRAINER acts as a development utility within the CUSTOS AI ecosystem.

Its purpose is to accelerate AI experimentation by allowing quick dataset generation and model training.

The trained models can later be integrated into different CUSTOS components such as behavior detection systems, gesture recognition, and intelligent monitoring modules.

AUTHOR

Varunthej Parimi

Developer of the CUSTOS Guardian Intelligence System
