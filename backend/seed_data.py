"""Seed puzzle data for TechTangle."""

PUZZLES = [
    # ===== BEGINNER (10) =====
    {"word": "ARRAY", "definition": "An ordered collection of elements identified by index, stored in contiguous memory.", "category": "Data Structures", "difficulty": "beginner", "points_reward": 10},
    {"word": "LOOP", "definition": "A control flow construct that repeats a block of code until a condition is met.", "category": "Programming", "difficulty": "beginner", "points_reward": 10},
    {"word": "CLASS", "definition": "A blueprint for creating objects, encapsulating data and behavior in OOP.", "category": "OOP", "difficulty": "beginner", "points_reward": 10},
    {"word": "STACK", "definition": "A linear data structure following Last-In-First-Out (LIFO) ordering.", "category": "Data Structures", "difficulty": "beginner", "points_reward": 10},
    {"word": "QUEUE", "definition": "A linear data structure following First-In-First-Out (FIFO) ordering.", "category": "Data Structures", "difficulty": "beginner", "points_reward": 10},
    {"word": "BYTE", "definition": "A unit of digital information consisting of 8 bits.", "category": "Computer Basics", "difficulty": "beginner", "points_reward": 10},
    {"word": "CACHE", "definition": "A hardware or software component that stores data so future requests can be served faster.", "category": "Systems", "difficulty": "beginner", "points_reward": 10},
    {"word": "DEBUG", "definition": "The process of identifying and removing errors from a program.", "category": "Programming", "difficulty": "beginner", "points_reward": 10},
    {"word": "INPUT", "definition": "Data provided to a computer or program for processing.", "category": "Computer Basics", "difficulty": "beginner", "points_reward": 10},
    {"word": "PIXEL", "definition": "The smallest controllable element of a picture on a display screen.", "category": "Graphics", "difficulty": "beginner", "points_reward": 10},

    # ===== INTERMEDIATE (12) =====
    {"word": "BINARY", "definition": "A base-2 numeral system using only the digits 0 and 1.", "category": "Computer Basics", "difficulty": "intermediate", "points_reward": 20},
    {"word": "BOOLEAN", "definition": "A data type with two possible values: true or false.", "category": "Programming", "difficulty": "intermediate", "points_reward": 20},
    {"word": "POINTER", "definition": "A variable whose value is the memory address of another variable.", "category": "Programming", "difficulty": "intermediate", "points_reward": 20},
    {"word": "COMPILER", "definition": "A program that translates source code into machine code before execution.", "category": "Programming", "difficulty": "intermediate", "points_reward": 20},
    {"word": "FUNCTION", "definition": "A reusable block of code that performs a specific task when invoked.", "category": "Programming", "difficulty": "intermediate", "points_reward": 20},
    {"word": "ITERATOR", "definition": "An object that enables traversal of a container, particularly lists.", "category": "Data Structures", "difficulty": "intermediate", "points_reward": 20},
    {"word": "KERNEL", "definition": "The central component of an operating system managing hardware-software interaction.", "category": "Operating Systems", "difficulty": "intermediate", "points_reward": 20},
    {"word": "RECURSION", "definition": "A method where the solution depends on solutions to smaller instances of the same problem.", "category": "Algorithms", "difficulty": "intermediate", "points_reward": 20},
    {"word": "DATABASE", "definition": "An organized collection of structured information stored electronically.", "category": "Databases", "difficulty": "intermediate", "points_reward": 20},
    {"word": "PROTOCOL", "definition": "A set of rules governing the exchange of data between devices on a network.", "category": "Networking", "difficulty": "intermediate", "points_reward": 20},
    {"word": "HEURISTIC", "definition": "A practical problem-solving approach that finds good-enough solutions quickly.", "category": "Algorithms", "difficulty": "intermediate", "points_reward": 20},
    {"word": "ABSTRACTION", "definition": "Hiding complex implementation details and exposing only essential features.", "category": "OOP", "difficulty": "intermediate", "points_reward": 20},

    # ===== ADVANCED (12) =====
    {"word": "ALGORITHM", "definition": "A finite sequence of well-defined instructions for solving a class of problems.", "category": "Algorithms", "difficulty": "advanced", "points_reward": 35},
    {"word": "ENCRYPTION", "definition": "The process of converting information into a coded form to prevent unauthorized access.", "category": "Security", "difficulty": "advanced", "points_reward": 35},
    {"word": "POLYMORPHISM", "definition": "An OOP concept allowing objects of different classes to be treated as instances of a common superclass.", "category": "OOP", "difficulty": "advanced", "points_reward": 35},
    {"word": "INHERITANCE", "definition": "An OOP mechanism where one class derives properties and behavior from another.", "category": "OOP", "difficulty": "advanced", "points_reward": 35},
    {"word": "INTERFACE", "definition": "A contract specifying methods that implementing classes must provide.", "category": "OOP", "difficulty": "advanced", "points_reward": 35},
    {"word": "SCHEDULER", "definition": "An OS component that decides which process runs next on the CPU.", "category": "Operating Systems", "difficulty": "advanced", "points_reward": 35},
    {"word": "SEMAPHORE", "definition": "A synchronization primitive used to control access to shared resources in concurrent systems.", "category": "Operating Systems", "difficulty": "advanced", "points_reward": 35},
    {"word": "GARBAGE", "definition": "Memory that is no longer reachable but has not been reclaimed; subject to automatic collection.", "category": "Memory Management", "difficulty": "advanced", "points_reward": 35},
    {"word": "REGISTER", "definition": "A small, fast storage location directly within the CPU used to hold operands and instructions.", "category": "Computer Architecture", "difficulty": "advanced", "points_reward": 35},
    {"word": "BLOCKCHAIN", "definition": "A distributed ledger of records linked using cryptography in chronologically ordered blocks.", "category": "Distributed Systems", "difficulty": "advanced", "points_reward": 35},
    {"word": "MIDDLEWARE", "definition": "Software acting as a bridge between an operating system or database and applications.", "category": "Systems", "difficulty": "advanced", "points_reward": 35},
    {"word": "REFACTORING", "definition": "Restructuring existing code without changing its external behavior to improve readability or design.", "category": "Software Engineering", "difficulty": "advanced", "points_reward": 35},

    # ===== EXPERT (10) =====
    {"word": "NORMALIZATION", "definition": "The process of organizing a database to reduce redundancy and improve data integrity.", "category": "Databases", "difficulty": "expert", "points_reward": 50},
    {"word": "SERIALIZATION", "definition": "Converting an object's state into a format that can be stored or transmitted and later reconstructed.", "category": "Software Engineering", "difficulty": "expert", "points_reward": 50},
    {"word": "ENCAPSULATION", "definition": "Bundling data and methods that operate on that data within one unit while restricting external access.", "category": "OOP", "difficulty": "expert", "points_reward": 50},
    {"word": "MEMOIZATION", "definition": "An optimization technique storing results of expensive function calls and reusing them on identical inputs.", "category": "Algorithms", "difficulty": "expert", "points_reward": 50},
    {"word": "MULTITHREADING", "definition": "A technique enabling concurrent execution of multiple threads within a single process.", "category": "Concurrency", "difficulty": "expert", "points_reward": 50},
    {"word": "VIRTUALIZATION", "definition": "Creating a virtual version of computing resources such as servers, storage, or networks.", "category": "Systems", "difficulty": "expert", "points_reward": 50},
    {"word": "AUTHENTICATION", "definition": "The process of verifying the identity of a user, system, or process before granting access.", "category": "Security", "difficulty": "expert", "points_reward": 50},
    {"word": "CONCURRENCY", "definition": "The ability of a system to manage multiple tasks making progress in overlapping time periods.", "category": "Concurrency", "difficulty": "expert", "points_reward": 50},
    {"word": "REPLICATION", "definition": "Maintaining identical copies of data across multiple nodes for fault tolerance and availability.", "category": "Distributed Systems", "difficulty": "expert", "points_reward": 50},
    {"word": "ORCHESTRATION", "definition": "Automated coordination, management, and deployment of containerized applications and services.", "category": "DevOps", "difficulty": "expert", "points_reward": 50},
]
