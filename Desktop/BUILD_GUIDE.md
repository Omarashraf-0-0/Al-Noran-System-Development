# Noran Desktop Application - Build & Distribution Guide

## Quick Start - Building the App

### Option 1: Build Runnable JAR (Recommended for Distribution)

Run the following Maven command:

```bash
mvn clean package -DskipTests
```

This creates `target/NoranDesktopApp.jar` (~56 MB) which contains all dependencies.

### Running the JAR

Users need **Java 17+** installed. They can run it with:

```bash
java -jar NoranDesktopApp.jar
```

Or on Windows, simply double-click the JAR file (if Java is associated with .jar files).

---

## Option 2: Create Windows EXE Installer

For users who don't have Java installed, you can create a native Windows installer that bundles the JRE.

### Prerequisites:
- JDK 17+ with `jpackage` tool
- WiX Toolset 3.x (for EXE installers) - Download from: https://wixtoolset.org/

### Build EXE Installer:

```bash
# First build the fat JAR
mvn clean package -DskipTests

# Then create the EXE installer
jpackage ^
    --type exe ^
    --name "NoranDesktopApp" ^
    --app-version 1.0.0 ^
    --vendor "Noran" ^
    --description "Al Noran Desktop Application" ^
    --input target ^
    --main-jar NoranDesktopApp.jar ^
    --main-class noran.desktop.Launcher ^
    --dest target/installer ^
    --win-dir-chooser ^
    --win-menu ^
    --win-shortcut
```

The EXE installer will be created in `target/installer/`.

### Alternative: Create Standalone EXE (app-image)

If you don't want an installer but just a standalone EXE:

```bash
jpackage ^
    --type app-image ^
    --name "NoranDesktopApp" ^
    --input target ^
    --main-jar NoranDesktopApp.jar ^
    --main-class noran.desktop.Launcher ^
    --dest target/app
```

This creates a folder `target/app/NoranDesktopApp/` containing:
- `NoranDesktopApp.exe` - The executable
- `runtime/` - Bundled Java runtime
- `app/` - Application files

You can zip this folder and distribute it.

---

## Easy Build Script

Simply run `build.bat` to build everything with guided prompts.

---

## File Sizes

| Output | Approximate Size |
|--------|------------------|
| Fat JAR | ~56 MB |
| EXE Installer | ~70-100 MB |
| App Image (folder) | ~150-200 MB |

---

## Distribution Options

1. **JAR File** - Smallest size, requires Java 17+ on user's machine
2. **EXE Installer** - Medium size, installs with bundled JRE
3. **App Image (ZIP)** - Largest size, portable with bundled JRE

---

## Troubleshooting

### "JavaFX runtime components are missing"
Make sure you're using the fat JAR (`NoranDesktopApp.jar`), not the smaller `Desktop-1.0-SNAPSHOT.jar`.

### JAR won't run by double-clicking
Create a batch file `run.bat` next to the JAR:
```batch
@echo off
java -jar NoranDesktopApp.jar
pause
```

### jpackage not found
Make sure JDK 17+ is installed and `JAVA_HOME/bin` is in your PATH.
