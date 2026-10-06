import os
from pathlib import Path
from app.config import UPLOAD_DIR
from app.models.database import db_get_all_documents, db_insert_document, db_update_document_status
from app.utils.text_processing import chunk_document_pages
from app.services.vector_store_service import get_vector_store

DEMO_DOCUMENTS = [
    {
        "id": "demo-bio",
        "name": "Biology Ch.4 — Photosynthesis.pdf",
        "kind": "pdf",
        "pages": [
            {
                "page": 1,
                "text": """Chapter 4: Photosynthesis and Cellular Energetics

Introduction:
All life on Earth requires energy to survive. The primary source of this energy is the sun. Autotrophs, such as plants, algae, and cyanobacteria, have the unique ability to capture solar radiation and convert it into chemical energy stored in molecular bonds of sugars. This biological process is known as photosynthesis.

General Chemical Formula:
6 CO2 (Carbon Dioxide) + 6 H2O (Water) + Light Energy -> C6H12O6 (Glucose) + 6 O2 (Oxygen).

Plants absorb water through their roots from the soil, take in carbon dioxide from the surrounding air through tiny pores called stomata, and harness photons of sunlight using green pigment molecules called chlorophyll."""
            },
            {
                "page": 2,
                "text": """Chloroplast Structure:
Photosynthesis takes place within specialized organelles called chloroplasts. Chloroplasts are bounded by a double membrane and contain disc-like structures called thylakoids stacked into columns called grana. The fluid surrounding the thylakoids is the stroma.

The Two Stages of Photosynthesis:
1. Light-Dependent Reactions (occurs across thylakoid membranes):
Chlorophyll absorbs light energy and excites electrons. Water molecules (H2O) are split through photolysis into protons, electrons, and oxygen gas (O2), which is released into the atmosphere as a byproduct. The flow of energized electrons generates ATP and NADPH.

2. The Light-Independent Reactions or Calvin Cycle (occurs in the stroma):
ATP and NADPH from the light reactions provide chemical energy to fix carbon dioxide into three-carbon sugars (G3P), which are later assembled into glucose and starch."""
            },
            {
                "page": 3,
                "text": """Factors Influencing Photosynthesis:
The rate of photosynthetic activity is constrained by three principal environmental factors:
1. Light Intensity: As photon flux increases, the rate increases linearly until chlorophyll absorption reaches saturation.
2. Carbon Dioxide Concentration: CO2 serves as the essential carbon substrate for the enzyme RuBisCO in the Calvin cycle. Low CO2 levels limit sugar output.
3. Temperature: Because the Calvin cycle relies on enzymatic catalysts, extreme cold slows reaction rates, while excessive heat denatures RuBisCO and other protein complexes.

Ecological Significance:
Photosynthesis is responsible for maintaining Earth's atmospheric oxygen levels and provides the organic biomass supporting terrestrial and aquatic food webs."""
            }
        ]
    },
    {
        "id": "demo-cs",
        "name": "Data Structures — Recursion Notes.docx",
        "kind": "docx",
        "pages": [
            {
                "page": 1,
                "text": """Lecture Notes: Recursion and Divide & Conquer Strategies

What is Recursion?
Recursion is a fundamental programming paradigm where a function solves a problem by calling a smaller instance of itself. Rather than using iterative loops (such as for or while), a recursive routine delegates sub-problems down until reaching a trivial boundary condition.

The Anatomy of a Recursive Function:
Every correct recursive algorithm must consist of two essential elements:
1. The Base Case: A condition that stops recursion without making another self-call. Without an explicit base case, the function will execute indefinitely until call stack exhaustion causes a StackOverflow error.
2. The Recursive Case: The logic where the function invokes itself with updated arguments that move closer to the base case."""
            },
            {
                "page": 2,
                "text": """Classic Example: Factorial Computation
Mathematical definition: n! = n * (n-1)! for n > 1, with 0! = 1 and 1! = 1.

Python Implementation:
def factorial(n):
    # Base case: stop when n reaches 0 or 1
    if n <= 1:
        return 1
    # Recursive case: shrink problem
    return n * factorial(n - 1)

Call Stack Execution for factorial(4):
factorial(4) calls 4 * factorial(3)
factorial(3) calls 3 * factorial(2)
factorial(2) calls 2 * factorial(1)
factorial(1) returns 1 (Base Case reached!)
The values return back up the call stack: 2 * 1 = 2 -> 3 * 2 = 6 -> 4 * 6 = 24."""
            },
            {
                "page": 3,
                "text": """Recursion vs. Iteration:
- Memory: Recursive calls allocate a new stack frame on the call stack for each level of depth (O(N) memory overhead). Iteration uses constant stack space (O(1)).
- Readability: Algorithms like tree traversals, DFS graph searches, and divide-and-conquer algorithms (Merge Sort, Quick Sort) are far more natural and elegant when expressed recursively.
- Tail Call Optimization (TCO): Some compilers can optimize tail-recursive functions into iterative jumps to save stack memory."""
            }
        ]
    },
    {
        "id": "demo-phy",
        "name": "Physics — Newton's Laws.txt",
        "kind": "txt",
        "pages": [
            {
                "page": 1,
                "text": """Newtonian Mechanics: The Three Laws of Motion

Historical Overview:
Sir Isaac Newton published the fundamental laws of classical mechanics in the 'Philosophiae Naturalis Principia Mathematica' in 1687. These laws govern the relationship between physical bodies and the forces acting upon them.

First Law: The Law of Inertia
An object at rest remains at rest, and an object in uniform motion remains in motion along a straight line at constant velocity, unless acted upon by a net external force.
Inertia is the inherent tendency of an object to resist changes in its state of motion. Mass is the quantitative measure of an object's inertia."""
            },
            {
                "page": 2,
                "text": """Second Law: Force and Acceleration
The acceleration of an object is directly proportional to the net force acting upon it and inversely proportional to its mass. The direction of acceleration is in the direction of the net force.

Fundamental Equation:
F_net = m * a
where:
F = Net Force (measured in Newtons, N)
m = Mass (measured in kilograms, kg)
a = Acceleration (measured in meters per second squared, m/s^2)

Practical Meaning:
If you apply the same force to a heavy mass and a light mass, the light mass accelerates significantly faster. To double the speed-up of an object, you must exert double the force."""
            },
            {
                "page": 3,
                "text": """Third Law: Action and Reaction
For every action, there is an equal and opposite reaction.
Whenever body A exerts a force on body B, body B simultaneously exerts an equal magnitude force in the opposite direction on body A.

Examples in Action:
- Rocket Propulsion: High-speed exhaust gases pushed downward exert an equal reaction force upward on the rocket.
- Walking: Your feet push backward against the ground, and the friction of the Earth pushes you forward."""
            }
        ]
    }
]

def initialize_demo_materials():
    """Initializes standard demonstration documents into database and FAISS index if empty."""
    existing_docs = db_get_all_documents()
    existing_ids = {d["id"] for d in existing_docs}
    vector_store = get_vector_store()

    for demo in DEMO_DOCUMENTS:
        doc_id = demo["id"]
        if doc_id in existing_ids:
            continue

        clean_name = demo["name"]
        kind = demo["kind"]
        pages = demo["pages"]
        total_text = "\n\n".join(p["text"] for p in pages)
        size_bytes = len(total_text.encode("utf-8"))

        # Save dummy file on disk
        file_path = UPLOAD_DIR / f"{doc_id}_{clean_name}"
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(total_text)

        # Insert DB record
        db_insert_document(
            doc_id=doc_id,
            name=clean_name,
            kind=kind,
            size_bytes=size_bytes,
            pages=len(pages),
            status="ready",
            file_path=str(file_path),
            is_demo=True
        )

        # Chunk and add to FAISS
        chunks = chunk_document_pages(
            pages=pages,
            document_id=doc_id,
            document_name=clean_name
        )
        vector_store.add_chunks(chunks)

    print("Demo documents checked/initialized.")
