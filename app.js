/* ============================================================
   SIMULOpos ICS
   Simulador local
============================================================ */


/* ============================================================
   CONFIGURACIÓN
============================================================ */

const CATEGORIES = {

    auxadm: {

        name: "Aux. Administratiu/va",

        shortName: "Aux. Administratiu/va",

        file:
            "preguntas_ics_aux_administratiu.json",

        icon:
            "📋",

        description:
            "Preguntes del temari d'Auxiliar Administratiu/va de l'ICS.",

        color:
            "#2563eb"
    },


    administratiu: {

        name:
            "Administratiu/va",

        shortName:
            "Administratiu/va",

        file:
            "preguntas_ics_administratiu.json",

        icon:
            "📁",

        description:
            "Preguntes del temari d'Administratiu/va de l'ICS.",

        color:
            "#7c3aed"
    },


    transversal: {

        name:
            "Transversal",

        shortName:
            "Temari comú",

        file:
            "preguntas_ics_transversal.json",

        icon:
            "📚",

        description:
            "Temari comú i transversal de l'ICS.",

        color:
            "#0891b2"
    }

};


/* ============================================================
   ESTADO
============================================================ */

const state = {

    category:
        null,

    block:
        "all",

    questions:
        [],

    current:
        0,

    answers:
        {},

    correct:
        0,

    wrong:
        0,

    startTime:
        null,

    timerInterval:
        null,

    elapsed:
        0,

    data:
        {}

};


/* ============================================================
   BLOQUES POR DEFECTO
============================================================ */

const DEFAULT_BLOCKS = {

    auxadm: {

        dret:
            "⚖️ Dret administratiu",

        dades:
            "🔒 Protecció de dades",

        transparencia:
            "🏛️ Transparència",

        ics:
            "🏥 Organització ICS",

        informatica:
            "💻 Informàtica",

        gestioarchius:
            "📂 Gestió d'arxius",

        rrhhadm:
            "👥 RRHH administratiu",

        prl:
            "⚠️ PRL",

        igualtat:
            "⚖️ Igualtat",

        qualitat:
            "🔄 Qualitat",

        carrera:
            "🏅 Carrera professional"
    },


    administratiu: {

        dret:
            "⚖️ Dret administratiu",

        rrhh:
            "👥 Recursos humans",

        sistemes:
            "💻 Sistemes",

        sanitari:
            "🏥 Organització sanitària",

        comptabilitat:
            "📊 Comptabilitat",

        contractaciopublica:
            "📋 Contractació pública",

        gestioeconomica:
            "💶 Gestió econòmica",

        prl:
            "⚠️ PRL",

        igualtat:
            "⚖️ Igualtat",

        qualitat:
            "🔄 Qualitat",

        carrera:
            "🏅 Carrera professional"
    },


    transversal: {

        organitzacio:
            "🏥 Organització sanitària",

        marc_legal:
            "📜 Marc legal",

        drets_pacient:
            "🩺 Drets del pacient",

        prl:
            "⚠️ PRL",

        igualtat:
            "⚖️ Igualtat",

        lopd:
            "🔒 LOPD",

        qualitat:
            "🔄 Qualitat",

        carrera:
            "🏅 Carrera professional",

        pla_salut:
            "📋 Pla de Salut"
    }

};


/* ============================================================
   UTILIDADES DOM
============================================================ */

const $ = id =>
    document.getElementById(id);


/* ============================================================
   INICIO
============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    init
);


async function init() {

    setupEvents();

    loadTheme();

    renderCategories();

    await loadAllData();

}


/* ============================================================
   CARGA JSON
============================================================ */

async function loadAllData() {

    $("loading").classList.remove("hidden");

    $("errorPanel").classList.add("hidden");

    const entries =
        Object.entries(CATEGORIES);


    try {

        for (const [key, category] of entries) {

            const response =
                await fetch(category.file);

            if (!response.ok) {

                throw new Error(
                    `No s'ha pogut carregar ${category.file}`
                );

            }

            const json =
                await response.json();

            state.data[key] =
                normalizeData(json);

        }

        $("loading").classList.add("hidden");

        updateCategoryCounts();

    }
    catch (error) {

        console.error(error);

        $("loading").classList.add("hidden");

        $("errorText").textContent =
            error.message +
            ". Comprova que els fitxers JSON són a la mateixa carpeta que index.html.";

        $("errorPanel").classList.remove("hidden");

    }

}

/* ============================================================
   NORMALIZAR JSON
============================================================ */

function normalizeData(json) {

    /*
       Admet tant:

       {
           preguntas: [...]
       }

       com:

       [...]
    */

    let questions =
        Array.isArray(json)
            ? json
            : json.preguntas || [];


    return questions.map((q, index) => {

        const options =
            q.opciones ||
            q.options ||
            q.opts ||
            q.respuestas || // Compatibilidad añadida
            [];


        const normalizedOptions =
            options.map((option, i) => {

                if (typeof option === "string") {

                    return {

                        text:
                            option,

                        correct:
                            i === q.respuesta_correcta_indice
                    };

                }


                return {

                    text:
                        option.texto ??
                        option.text ??
                        "",

                    correct:
                        Boolean(
                            option.correcta ??
                            option.correct ??
                            false
                        )
                };

            });


        let correctIndex =
            normalizedOptions.findIndex(
                option =>
                    option.correct
            );


        if (
            correctIndex < 0 &&
            Number.isInteger(
                q.respuesta_correcta_indice
            )
        ) {

            correctIndex =
                q.respuesta_correcta_indice;

        }

        // Compatibilidad añadida para cuando la respuesta correcta es un número directo
        if (
            correctIndex < 0 &&
            Number.isInteger(
                q.respuesta_correcta
            )
        ) {

            correctIndex = 
                q.respuesta_correcta;
                
        }


        if (
            correctIndex < 0 &&
            typeof q.respuesta_correcta === "string"
        ) {

            const letter =
                q.respuesta_correcta
                    .trim()
                    .toUpperCase();

            const indexFromLetter =
                "ABCD".indexOf(letter);

            if (indexFromLetter >= 0) {

                correctIndex =
                    indexFromLetter;

            }

        }


        return {

            id:
                q.id ??
                `q-${index}`,

            category:
                q.categoria ??
                q.bloc ??
                q.bloc_tematico ?? // Compatibilidad añadida
                "general",

            categoryName:
                q.categoria_nombre ??
                q.categoryName ??
                "",

            text:
                q.pregunta ??
                q.text ??
                q.texto ?? // Compatibilidad añadida
                q.t ??
                "",

            options:
                normalizedOptions,

            correctIndex,

            explanation:
                q.explicacion ??
                q.explanation ??
                q.ok ??
                "",

            wrongExplanation:
                q.explicacion_incorrecta ??
                q.explanationWrong ??
                q.ko ??
                "",

            source:
                q.fuente ??
                q.source ??
                q.src ??
                ""

        };

    });

}

/* ============================================================
   CATEGORIAS
============================================================ */

function renderCategories() {

    const container =
        $("categoryCards");

    container.innerHTML =
        "";


    Object.entries(CATEGORIES)
        .forEach(
            ([key, category]) => {

                const card =
                    document.createElement("div");

                card.className =
                    "category-card";

                card.dataset.category =
                    key;


                card.innerHTML = `

                    <div class="category-icon">
                        ${category.icon}
                    </div>

                    <h3>
                        ${category.name}
                    </h3>

                    <p>
                        ${category.description}
                    </p>

                    <div class="category-count"
                         id="count-${key}">
                        Carregant preguntes...
                    </div>

                `;


                card.addEventListener(
                    "click",
                    () =>
                        selectCategory(key)
                );


                container.appendChild(card);

            }
        );

}


function updateCategoryCounts() {

    Object.keys(CATEGORIES)
        .forEach(key => {

            const count =
                state.data[key]?.length || 0;

            const element =
                $(`count-${key}`);

            if (!element)
                return;


            element.textContent =
                `${count} preguntes disponibles`;

        });

}


/* ============================================================
   SELECCIONAR CATEGORIA
============================================================ */

function selectCategory(key) {

    if (!state.data[key])
        return;


    state.category =
        key;


    document
        .querySelectorAll(".category-card")
        .forEach(card => {

            card.classList.toggle(
                "active",
                card.dataset.category === key
            );

        });


    renderBlocks();

    $("blockPanel")
        .classList.remove("hidden");


    $("testPanel")
        .classList.add("hidden");


    $("resultsPanel")
        .classList.add("hidden");


    window.scrollTo({

        top:
            $("blockPanel").offsetTop - 90,

        behavior:
            "smooth"

    });

}


/* ============================================================
   BLOQUES
============================================================ */

function renderBlocks() {

    const container =
        $("blockGrid");

    container.innerHTML =
        "";


    const questions =
        state.data[state.category] || [];


    const blockNames =
        getBlockNames();


    const allCard =
        createBlockCard(
            "all",
            "📚",
            "Tot el temari",
            "Totes les preguntes disponibles",
            questions.length,
            true
        );


    container.appendChild(
        allCard
    );


    Object.entries(blockNames)
        .forEach(
            ([key, name]) => {

                const count =
                    questions.filter(
                        q =>
                            q.category === key
                    ).length;


                if (count === 0)
                    return;


                const icon =
                    extractIcon(name);


                const title =
                    removeIcon(name);


                const card =
                    createBlockCard(
                        key,
                        icon,
                        title,
                        getBlockDescription(key),
                        count,
                        false
                    );


                container.appendChild(card);

            }
        );

}


function createBlockCard(
    key,
    icon,
    title,
    description,
    count,
    all
) {

    const card =
        document.createElement("div");

    card.className =
        "block-card" +
        (all ? " all" : "");


    card.innerHTML = `

        <div class="block-icon">
            ${icon}
        </div>

        <h3>
            ${title}
        </h3>

        <p>
            ${description}
        </p>

        <span class="block-count">
            ${count} preguntes
        </span>

    `;


    card.addEventListener(
        "click",
        () =>
            startTest(key)
    );


    return card;

}


function getBlockNames() {

    return {

        ...(DEFAULT_BLOCKS[state.category] || {})

    };

}


function getBlockDescription(key) {

    const descriptions = {

        dret:
            "Normativa i dret administratiu",

        dades:
            "Protecció de dades personals",

        transparencia:
            "Transparència i bon govern",

        ics:
            "Organització i funcionament de l'ICS",

        informatica:
            "Sistemes i eines informàtiques",

        gestioarchius:
            "Gestió documental i arxius",

        rrhhadm:
            "Recursos humans administratius",

        rrhh:
            "Personal i recursos humans",

        sistemes:
            "Sistemes d'informació",

        sanitari:
            "Organització sanitària",

        comptabilitat:
            "Comptabilitat pública",

        contractaciopublica:
            "Contractació pública",

        gestioeconomica:
            "Gestió econòmica",

        prl:
            "Prevenció de riscos laborals",

        igualtat:
            "Igualtat efectiva",

        qualitat:
            "Gestió i qualitat",

        carrera:
            "Carrera professional",

        organitzacio:
            "Organització sanitària",

        marc_legal:
            "Marc jurídic aplicable",

        drets_pacient:
            "Drets de les persones usuàries",

        lopd:
            "Protecció de dades",

        pla_salut:
            "Pla de Salut"

    };


    return (
        descriptions[key] ||
        "Preguntes d'aquest bloc temàtic"
    );

}


/* ============================================================
   TEST
============================================================ */

function startTest(block) {

    state.block =
        block;


    let pool =
        state.data[state.category]
            .filter(
                q =>
                    block === "all" ||
                    q.category === block
            );


    if (!pool.length) {

        alert(
            "No hi ha preguntes disponibles en aquest bloc."
        );

        return;

    }


    pool =
        shuffle(
            [...pool]
        );


    state.questions =
        pool;

    state.current =
        0;

    state.answers =
        {};

    state.correct =
        0;

    state.wrong =
        0;

    state.elapsed =
        0;


    state.startTime =
        Date.now();


    startTimer();


    $("testCategory").textContent =
        CATEGORIES[state.category].name;


    $("testBlock").textContent =
        block === "all"
            ? "Tot el temari"
            : removeIcon(
                getBlockNames()[block] ||
                block
            );


    $("blockPanel")
        .classList.add("hidden");

    $("resultsPanel")
        .classList.add("hidden");

    $("testPanel")
        .classList.remove("hidden");


    renderQuestionMap();

    showQuestion();

    updateStats();


    window.scrollTo({

        top:
            $("testPanel").offsetTop - 85,

        behavior:
            "smooth"

    });

}


/* ============================================================
   PREGUNTA
============================================================ */

function showQuestion() {

    const q =
        state.questions[state.current];


    if (!q) {

        finishTest();

        return;

    }


    $("questionNumber").textContent =
        `PREGUNTA ${state.current + 1}`;


    $("questionText").textContent =
        q.text;


    $("questionSource").textContent =
        q.source
            ? `Font: ${q.source}`
            : "";


    renderOptions(q);

    renderFeedback(q);

    updateProgress();

    updateQuestionMap();

    $("nextButton").disabled =
        state.answers[q.id] === undefined;


    $("answeredLabel").textContent =
        state.answers[q.id] === undefined
            ? "Selecciona una resposta"
            : "Resposta registrada";

}


/* ============================================================
   OPCIONES
============================================================ */

function renderOptions(q) {

    const container =
        $("optionsContainer");

    container.innerHTML =
        "";


    q.options.forEach(
        (option, index) => {

            const button =
                document.createElement("button");

            button.className =
                "option";


            const answerLetter =
                "ABCD"[index];


            button.innerHTML = `

                <span class="option-letter">
                    ${answerLetter}
                </span>

                <span class="option-text">
                    ${escapeHtml(
                        option.text
                    )}
                </span>

            `;


            const previous =
                state.answers[q.id];


            if (
                previous !== undefined
            ) {

                button.classList.add(
                    "disabled"
                );


                if (
                    index === q.correctIndex
                ) {

                    button.classList.add(
                        "correct"
                    );

                }


                if (
                    index === previous &&
                    index !== q.correctIndex
                ) {

                    button.classList.add(
                        "wrong"
                    );

                }

            }
            else {

                button.addEventListener(
                    "click",
                    () =>
                        answerQuestion(
                            index
                        )
                );

            }


            container.appendChild(
                button
            );

        }
    );

}


/* ============================================================
   RESPONDER
============================================================ */

function answerQuestion(index) {

    const q =
        state.questions[state.current];


    if (
        state.answers[q.id] !== undefined
    )
        return;


    state.answers[q.id] =
        index;


    if (
        index === q.correctIndex
    ) {

        state.correct++;

    }
    else {

        state.wrong++;

    }


    renderOptions(q);

    renderFeedback(q);

    updateStats();

    updateQuestionMap();


    $("nextButton").disabled =
        false;


    $("answeredLabel").textContent =
        index === q.correctIndex
            ? "✓ Resposta correcta"
            : "✕ Resposta incorrecta";

}


/* ============================================================
   FEEDBACK
============================================================ */

function renderFeedback(q) {

    const feedback =
        $("feedback");


    const answer =
        state.answers[q.id];


    if (answer === undefined) {

        feedback.className =
            "feedback hidden";

        return;

    }


    const correct =
        answer === q.correctIndex;


    feedback.className =
        `feedback ${
            correct
                ? "correct"
                : "wrong"
        }`;


    $("feedbackIcon").textContent =
        correct
            ? "✓"
            : "✕";


    $("feedbackTitle").textContent =
        correct
            ? "Correcte!"
            : `Incorrecte. La resposta correcta és ${"ABCD"[q.correctIndex]}.`;


    let explanation =
        correct
            ? q.explanation
            : q.wrongExplanation || q.explanation;


    if (!explanation) {
        
        // Mejora pedagógica: Extraer el texto completo de la opción correcta
        // para que el estudiante aprenda el concepto si el JSON no tiene explicación.
        const correctOptionText = q.options[q.correctIndex] ? q.options[q.correctIndex].text : "";

        if (correctOptionText) {
            explanation = `La resposta correcta és: ${correctOptionText}`;
        } else {
            explanation = `La resposta correcta és ${"ABCD"[q.correctIndex]}.`;
        }

    }


    $("feedbackText").textContent =
        explanation;

}

/* ============================================================
   SIGUIENTE
============================================================ */

function nextQuestion() {

    const q =
        state.questions[state.current];


    if (
        state.answers[q.id] === undefined
    )
        return;


    if (
        state.current <
        state.questions.length - 1
    ) {

        state.current++;

        showQuestion();

        return;

    }


    finishTest();

}


/* ============================================================
   RESULTADOS
============================================================ */

function finishTest() {

    stopTimer();


    const total =
        state.questions.length;


    const accuracy =
        total
            ? Math.round(
                state.correct /
                total *
                100
            )
            : 0;


    $("finalAccuracy").textContent =
        `${accuracy}%`;


    $("finalTotal").textContent =
        total;


    $("finalCorrect").textContent =
        state.correct;


    $("finalWrong").textContent =
        state.wrong;


    $("finalTime").textContent =
        formatTime(state.elapsed);


    $("resultsSummary").textContent =
        `Has completat ${total} preguntes de ${
            CATEGORIES[state.category].name
        }.`;


    const degrees =
        accuracy * 3.6;


    $("finalAccuracy")
        .closest(".score-circle")
        .style.background =
            `conic-gradient(
                var(--primary) ${degrees}deg,
                #e8edf5 ${degrees}deg
            )`;


    $("testPanel")
        .classList.add("hidden");

    $("resultsPanel")
        .classList.remove("hidden");


    window.scrollTo({

        top:
            $("resultsPanel").offsetTop - 80,

        behavior:
            "smooth"

    });

}


/* ============================================================
   ESTADISTICAS
============================================================ */

function updateStats() {

    const total =
        state.questions.length;


    const answered =
        Object.keys(
            state.answers
        ).length;


    const accuracy =
        answered
            ? Math.round(
                state.correct /
                answered *
                100
            )
            : 0;


    $("questionCounter").textContent =
        `${state.current + 1} / ${total}`;


    $("correctCounter").textContent =
        state.correct;


    $("wrongCounter").textContent =
        state.wrong;


    $("accuracyCounter").textContent =
        `${accuracy}%`;

}


function updateProgress() {

    const total =
        state.questions.length;


    const percent =
        total
            ? Math.round(
                (state.current + 1) /
                total *
                100
            )
            : 0;


    $("progressBar")
        .style.width =
        `${percent}%`;


    $("progressPercent").textContent =
        `${percent}%`;

}


/* ============================================================
   MAPA DE PREGUNTAS
============================================================ */

function renderQuestionMap() {

    const container =
        $("questionMap");

    container.innerHTML =
        "";


    state.questions.forEach(
        (q, index) => {

            const button =
                document.createElement("button");

            button.className =
                "map-item";


            button.textContent =
                index + 1;


            button.addEventListener(
                "click",
                () => {

                    state.current =
                        index;

                    showQuestion();

                }
            );


            container.appendChild(
                button
            );

        }
    );

}


function updateQuestionMap() {

    document
        .querySelectorAll(".map-item")
        .forEach(
            (button, index) => {

                const q =
                    state.questions[index];


                button.className =
                    "map-item";


                if (
                    index === state.current
                ) {

                    button.classList.add(
                        "current"
                    );

                }


                const answer =
                    state.answers[q.id];


                if (
                    answer !== undefined
                ) {

                    if (
                        answer === q.correctIndex
                    ) {

                        button.classList.add(
                            "correct"
                        );

                    }
                    else {

                        button.classList.add(
                            "wrong"
                        );

                    }

                }

            }
        );

}


/* ============================================================
   TIMER
============================================================ */

function startTimer() {

    stopTimer();


    state.startTime =
        Date.now() -
        state.elapsed * 1000;


    state.timerInterval =
        setInterval(
            () => {

                state.elapsed =
                    Math.floor(
                        (
                            Date.now() -
                            state.startTime
                        ) / 1000
                    );


                $("timer").textContent =
                    formatTime(
                        state.elapsed
                    );

            },
            1000
        );

}


function stopTimer() {

    if (
        state.timerInterval
    ) {

        clearInterval(
            state.timerInterval
        );

        state.timerInterval =
            null;

    }

}


function formatTime(seconds) {

    const minutes =
        Math.floor(
            seconds / 60
        );

    const secs =
        seconds % 60;


    return (
        String(minutes)
            .padStart(2, "0")
        +
        ":" +
        String(secs)
            .padStart(2, "0")
    );

}


/* ============================================================
   EVENTOS
============================================================ */

function setupEvents() {

    $("nextButton")
        .addEventListener(
            "click",
            nextQuestion
        );


    $("restartButton")
        .addEventListener(
            "click",
            () =>
                startTest(
                    state.block
                )
        );


    $("changeBlockButton")
        .addEventListener(
            "click",
            () => {

                stopTimer();

                $("testPanel")
                    .classList.add("hidden");

                $("blockPanel")
                    .classList.remove("hidden");

                window.scrollTo({

                    top:
                        $("blockPanel").offsetTop - 80,

                    behavior:
                        "smooth"

                });

            }
        );


    $("newTestButton")
        .addEventListener(
            "click",
            () =>
                startTest(
                    state.block
                )
        );


    $("resultChangeCategory")
        .addEventListener(
            "click",
            () => {

                $("resultsPanel")
                    .classList.add("hidden");

                window.scrollTo({

                    top: 0,

                    behavior:
                        "smooth"

                });

            }
        );


    $("themeToggle")
        .addEventListener(
            "click",
            toggleTheme
        );

}


/* ============================================================
   TEMA
============================================================ */

function toggleTheme() {

    document.body
        .classList.toggle("dark");


    const dark =
        document.body
            .classList.contains("dark");


    localStorage.setItem(
        "simulopos-theme",
        dark
            ? "dark"
            : "light"
    );


    $("themeToggle").textContent =
        dark
            ? "🌙"
            : "☀️";

}


function loadTheme() {

    const theme =
        localStorage.getItem(
            "simulopos-theme"
        );


    if (theme === "dark") {

        document.body
            .classList.add("dark");

        $("themeToggle").textContent =
            "🌙";

    }

}


/* ============================================================
   UTILIDADES
============================================================ */

function shuffle(array) {

    for (
        let i = array.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );


        [
            array[i],
            array[j]
        ] =
        [
            array[j],
            array[i]
        ];

    }


    return array;

}


function extractIcon(text) {

    if (!text)
        return "📚";


    const first =
        [...text.trim()][0];


    /*
       La mayoría de nuestros nombres
       comienzan por emoji.
    */

    return first || "📚";

}


function removeIcon(text) {

    if (!text)
        return "";


    return text
        .replace(
            /^[^\p{L}\p{N}]+/u,
            ""
        )
        .trim();

}


function escapeHtml(text) {

    return String(text)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* ============================================================
   TECLADO
============================================================ */

document.addEventListener(
    "keydown",
    event => {

        if (
            $("testPanel").classList.contains(
                "hidden"
            )
        )
            return;


        const key =
            event.key.toUpperCase();


        if (
            ["A", "B", "C", "D"].includes(key)
        ) {

            const index =
                "ABCD".indexOf(key);


            answerQuestion(index);

        }


        if (
            event.key === "Enter"
        ) {

            if (
                !$("nextButton").disabled
            ) {

                nextQuestion();

            }

        }

    }
);