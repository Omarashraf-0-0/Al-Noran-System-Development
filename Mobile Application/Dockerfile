# Step 1: Base image
FROM ubuntu:22.04

# Step 2: Install basic dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    unzip \
    xz-utils \
    zip \
    libglu1-mesa \
    openjdk-17-jdk \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Step 3: Set environment variables
ENV ANDROID_SDK_ROOT=/opt/android-sdk
ENV ANDROID_HOME=/opt/android-sdk
ENV PATH="$PATH:/opt/flutter/bin:/opt/flutter/bin/cache/dart-sdk/bin:/opt/android-sdk/cmdline-tools/latest/bin:/opt/android-sdk/platform-tools"

# Step 4: Set working directory
WORKDIR /app

# Step 5: Install Flutter SDK
RUN git clone https://github.com/flutter/flutter.git /opt/flutter -b stable
RUN flutter config --no-analytics && flutter precache

# Step 6: Install Android SDK Command-line tools
RUN mkdir -p /opt/android-sdk/cmdline-tools/latest
WORKDIR /opt/android-sdk/cmdline-tools

RUN wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O cmdline-tools.zip && \
    unzip cmdline-tools.zip -d /opt/android-sdk/cmdline-tools && \
    rm cmdline-tools.zip && \
    mkdir -p /opt/android-sdk/cmdline-tools/latest && \
    mv /opt/android-sdk/cmdline-tools/cmdline-tools/* /opt/android-sdk/cmdline-tools/latest/ || true

# Step 7: Install required Android components
RUN yes | sdkmanager --licenses || true && \
    sdkmanager --update && \
    sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"

# Step 8: Return to app directory
WORKDIR /app

# Step 9: Copy and install dependencies efficiently
# Copy only pubspec files first (dependency cache optimization)
COPY pubspec.* ./

# Ensure intl version compatibility with Flutter SDK
RUN flutter pub add intl:^0.20.2 || true
RUN flutter pub get || true

# Now copy the rest of the application
COPY . .

# Run pub get again after copying source files
RUN flutter pub get || true

# Step 10: Build release APK
RUN flutter build apk --release

# Step 11: Default command
CMD ["bash"]
