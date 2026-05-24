# Interactive-Internet-OS
# Interactive Internet OS 12.0

A browser-based operating system simulation featuring a virtual kernel, process manager, multitasking window system, virtual file system, bootloader, recovery mode, and a modular app ecosystem — built entirely with vanilla HTML, CSS, and JavaScript.

---

## Project Philosophy

This project is intentionally built without frameworks to explore low-level browser-based operating system architecture, interaction systems, state management, and reactive UI behavior using only front-end web technologies.

Most browser OS projects focus primarily on visual simulation.

This project focuses on:
- behavioral simulation
- process lifecycles
- system stress
- failure states
- recovery logic
- inter-process communication
- resource management

---

# Features

## Kernel Core
- Centralized kernel state system
- Asynchronous boot initialization
- Recovery mode + kernel panic handling
- System metrics tracking (CPU / memory simulation)

## Virtual File System (VFS)
- Persistent file storage using localStorage
- Hierarchical directory structure
- File read/write/delete support
- Dynamic folder creation

## Process Management
- Simulated process lifecycle
- Running/background process states
- Resource allocation system
- Automatic process termination under critical load

## Window Manager
- Draggable windows
- Resizable windows
- Focus stacking (z-index management)
- Maximize / minimize support
- Dock integration
- Persistent desktop icon positions

## Inter-Process Communication
- Event-driven architecture
- Global EventBus system
- Cross-app communication

## System Stress & Failure
- Reactive visual glitches under high load
- Kernel panic simulation
- Forced process termination
- Recovery mode boot system

---

# Included Apps

## System Apps
- File Explorer
- Terminal
- Settings
- System Monitor

## Productivity Apps
- Notes Editor
- Rich Text Editor
- Spreadsheet
- Calculator
- Clock

## Creative Apps
- IDE Sandbox (HTML/CSS/JS)
- Paint Application
- Whiteboard

## Media Apps
- Music Player
- Image Viewer

## Utility / Fun
- Sticky Notes
- 2048 Mini Game

---

# Architecture

```text
Bootloader
↓
Kernel (OSKernel)
↓
IPC + VFS + Process Manager
↓
Window Manager
↓
Apps

**Boot Sequence
**
The OS uses a truthful asynchronous boot system.

Subsystems initialize in real order:

Storage Controller
Virtual File System
System Settings
Inter-Process Communication
Process Monitor
Desktop Environment

If a critical failure occurs:

the system enters recovery mode
displays diagnostic information
allows factory reset and reboot
System Simulation Features

The OS simulates:

process execution
background tasks
CPU and memory load
system degradation
recovery behavior

High system stress may:

terminate processes
force recovery procedures

**Technologies Used
**
HTML5
CSS3
Vanilla JavaScript
localStorage API
Canvas API
Web Audio API

No frameworks or external UI libraries were used.

**Project Structure
**
Interactive-Internet-OS/
│
├── index.html
├── kernel.js
├── apps.js
├── boot.js
├── os.css


**Goals of the Project
**
This project explores the idea of a browser-native operating environment:
a system capable of persistence, process management, failure handling, and reactive behavior entirely within the browser.

The goal is not to recreate a real operating system,
but to study and simulate the architecture and behavior of one using front-end technologies.
