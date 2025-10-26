
        // --- Global State & Configuration ---
        const AVAILABLE_PORTS = [22, 80, 443, 8080, 3306];
        const REAL_PASSWORD = "AdminPass@123";
        const REAL_KEY = "CorrectKey_XYZ";
        const CIPHERTEXT = `[EncryptedDataBlob_for_${REAL_PASSWORD}]`;
        
        let currentPort;
        let mtdInterval;
        let isRunning = false;
        
        // --- DOM Element References ---
        const startBtn = document.getElementById('start-btn');
        const resetBtn = document.getElementById('reset-btn');
        const logBox = document.getElementById('log-box');
        
        const mtdStatus = document.getElementById('mtd-status');
        const portsContainer = document.getElementById('ports-container');
        const attackerMtdStatus = document.getElementById('attacker-mtd-status');
        
        const alarmBox = document.getElementById('alarm-box');
        const stolenDataEl = document.getElementById('stolen-data');
        const keyGuessEl = document.getElementById('key-guess');
        const decryptedResultEl = document.getElementById('decrypted-result');

        // --- Helper Functions ---

        /** Adds a message to the simulation log */
        function log(message, type = 'system') {
            const entry = document.createElement('p');
            entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
            entry.className = `log-entry log-${type}`;
            logBox.appendChild(entry);
            // Auto-scroll to the bottom
            logBox.scrollTop = logBox.scrollHeight;
        }

        /** Creates a promise that resolves after N milliseconds */
        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        /**
         * Initializes or resets the simulation to its default state.
         * @param {boolean} keepRunning - when true, do not set isRunning=false (used when starting)
         */
        function initializeSimulation(keepRunning = false) {
            // Stop any running intervals
            if (mtdInterval) clearInterval(mtdInterval);
            if (!keepRunning) isRunning = false;

            // Clear log
            logBox.innerHTML = '<p class="text-gray-500">Click "Start Simulation" to begin...</p>';

            // Reset MTD Panel
            portsContainer.innerHTML = '';
            AVAILABLE_PORTS.forEach(port => {
                const portEl = document.createElement('span');
                portEl.id = `port-${port}`;
                portEl.className = 'port';
                portEl.textContent = port;
                portsContainer.appendChild(portEl);
            });
            mtdStatus.textContent = 'Idle. Waiting to start...';
            attackerMtdStatus.textContent = 'Idle.';
            
            // Reset HE Panel
            alarmBox.classList.add('hidden');
            stolenDataEl.textContent = '[No data stolen yet]';
            keyGuessEl.textContent = '[Attacker has not guessed]';
            decryptedResultEl.textContent = '[...waiting for decryption...]';

            // Re-enable start button
            startBtn.disabled = false;
            startBtn.textContent = 'Start Simulation';
        }

        // --- Part 1: Honey Encryption (HE) Logic ---

        /** Generates a plausible-looking but fake password */
        function _generateFakeData(keyGuess) {
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            return `honey_pass_${keyGuess}_${randomSuffix}`;
        }

        /** Simulates the core of the Honey Encryption trap */
        function decrypt(ciphertextAttempt, keyGuess) {
            if (ciphertextAttempt !== CIPHERTEXT) {
                return "[Decrypt ERROR] Ciphertext mismatch.";
            }

            if (keyGuess === REAL_KEY) {
                log("[SYSTEM] Attacker successfully decrypted the real data!", 'warning');
                return REAL_PASSWORD;
            } else {
                // *** THE TRAP IS SPRUNG ***
                const fakeData = _generateFakeData(keyGuess);
                
                log('='.repeat(60), 'warning');
                log("!!! [SYSTEM ALARM] HONEY ENCRYPTION TRAP TRIGGERED !!!", 'warning');
                log(`    An attacker tried to decrypt with a bad key: '${keyGuess}'`, 'warning');
                log(`    We fed them plausible-looking FAKE data: '${fakeData}'`, 'warning');
                log("    The attacker *thinks they succeeded*, but we are now tracking them.", 'warning');
                log('='.repeat(60), 'warning');

                // Update the UI
                alarmBox.classList.remove('hidden');
                
                return fakeData;
            }
        }

        // --- Part 2: Moving Target Defense (MTD) Logic ---

        /** Internal loop to simulate MTD port hopping */
        function _portHoppingLoop() {
            // FIX: Check if running at the start of the loop
            if (!isRunning) return;

            // Remove highlight from old port
            if (currentPort) {
                const oldPortEl = document.getElementById(`port-${currentPort}`);
                if (oldPortEl) oldPortEl.classList.remove('port-active');
            }

            const oldPort = currentPort;
            // "Move" the target by picking a new port
            currentPort = AVAILABLE_PORTS[Math.floor(Math.random() * AVAILABLE_PORTS.length)];
            
            // Ensure the new port is different
            while (currentPort === oldPort) {
                currentPort = AVAILABLE_PORTS[Math.floor(Math.random() * AVAILABLE_PORTS.length)];
            }
            
            // Highlight new port
            const newPortEl = document.getElementById(`port-${currentPort}`);
            if (newPortEl) newPortEl.classList.add('port-active');
            
            const logMsg = `[MTD Server] --- TARGET HAS MOVED --- Port changed from ${oldPort || 'N/A'} to ${currentPort}`;
            log(logMsg, 'server');
            mtdStatus.textContent = `Active. Current port is ${currentPort}. Port hopping...`;
        }

        /** Starts the MTD loop */
        function startDefenseLoop() {
            _portHoppingLoop(); // Run once immediately
            mtdInterval = setInterval(_portHoppingLoop, 3000); // Change port every 3 seconds
        }

        /** Simulates an attacker trying to connect to a port */
        async function handleConnectionAttempt(portAttempt) {
            log(`[Attacker] -> Trying to connect to port ${portAttempt}...`, 'attacker');
            attackerMtdStatus.textContent = `Scanning port ${portAttempt}...`;
            
            const portEl = document.getElementById(`port-${portAttempt}`);
            // FIX: Check if element exists before adding class
            if (portEl) portEl.classList.add('port-scan'); // Show scan attempt
            await sleep(500); // Wait 0.5s for visual effect

            // FIX: Check if simulation was reset during the sleep
            if (!isRunning) return null;

            if (portAttempt === currentPort) {
                log(`[MTD Server] -> Connection ACCEPTED on port ${portAttempt}.`, 'server');
                log(`[MTD Server] Attacker has breached the perimeter!`, 'warning');
                attackerMtdStatus.textContent = `Breach successful on port ${portAttempt}!`;
                // FIX: Check if element exists before removing class
                if (portEl) portEl.classList.remove('port-scan');
                // On success, we leave it green (active)
                return CIPHERTEXT;
            } else {
                log(`[MTD Server] -> Connection REFUSED on port ${portAttempt}.`, 'server');
                // FIX: Check if element exists before removing class
                if (portEl) portEl.classList.remove('port-scan'); // Remove scan highlight
                return null;
            }
        }

        // --- Part 3: The Main Simulation ---

        async function runSimulation() {
            if (isRunning) return;

            // Initialize UI/state but keep the "running" flag set after init
            initializeSimulation(true); // Clear the board but keep isRunning state for the run
            isRunning = true;
            log('='.repeat(60), 'system');
            log("     Simulating Honey Encryption + Moving Target Defense", 'system');
            log('='.repeat(60), 'system');
            
            startBtn.disabled = true;
            startBtn.textContent = 'Simulation Running...';

            // 1. SETUP THE SERVER
            log(`[Encryptor] System armed. Protecting '${REAL_PASSWORD}'.`, 'system');
            log("[MTD Server] Server is online. Starting defense loop...", 'server');
            startDefenseLoop();
            
            await sleep(1000);

            // 2. SIMULATE THE ATTACKER (MTD PHASE)
            log("--- ATTACKER: PHASE 1 (Reconnaissance) ---", 'attacker');
            log("The attacker will now scan for the correct port...", 'attacker');
            attackerMtdStatus.textContent = 'Starting port scan...';

            let stolenData = null;
            const portsToTry = [80, 443, 22, 8080, 443, 3306, 22];

            for (const portToTry of portsToTry) {
                if (!isRunning) break; // Check if simulation was reset
                
                // Attacker makes an attempt
                stolenData = await handleConnectionAttempt(portToTry);
                
                if (stolenData) {
                    log(`\n[Attacker] Success! I'm in! I stole the data: ${stolenData}`, 'attacker');
                    stolenDataEl.textContent = stolenData;
                    break;
                }
                
                // Attacker waits and thinks, but the server is moving...
                attackerMtdStatus.textContent = 'Scan failed. Waiting...';
                await sleep(2000);
            }
            
            if (!stolenData && isRunning) { // Only show failure if not manually reset
                log("\n[Attacker] I failed to find the port. The target moved too fast!", 'attacker');
                log("SIMULATION END (MTD was successful)", 'system');
                attackerMtdStatus.textContent = 'Failed to find port. Target moved too fast.';
                if (mtdInterval) clearInterval(mtdInterval);
                isRunning = false;
                startBtn.disabled = false;
                startBtn.textContent = 'Start Simulation';
                return;
            }

            // Don't continue to HE phase if simulation was reset
            if (!isRunning) return;

            // 3. SIMULATE THE ATTACKER (HONEY ENCRYPTION PHASE)
            log("\n--- ATTACKER: PHASE 2 (Post-Breach) ---", 'attacker');
            log("[Attacker] I have the encrypted file. Now to decrypt it.", 'attacker');
            log("[Attacker] I'll try a common key from my list: 'password123'", 'attacker');
            
            await sleep(3000); // Dramatic pause

            // Check again if reset was hit during the pause
            if (!isRunning) return;
            
            const attackerKeyGuess = "password123";
            keyGuessEl.textContent = attackerKeyGuess;
            
            // The server's encryptor handles the decryption attempt
            const decryptedResult = decrypt(stolenData, attackerKeyGuess);
            
            decryptedResultEl.textContent = decryptedResult;
            
            log(`\n[Attacker] Decryption complete! Here's the password: ${decryptedResult}`, 'attacker');
            log("\n[Attacker] Great! It looks real. Now I'll try to use this password...", 'attacker');
            log("[Attacker] (Doesn't know it's a fake 'honey' password and that an alarm has been triggered.)", 'attacker');

            log("\n" + '='.repeat(60), 'system');
            log("     SIMULATION COMPLETE", 'system');
            log("     MTD made it hard to get in.", 'system');
            log("     HE made the attacker's 'success' a failure.", 'system');
            log('='.repeat(60), 'system');
            
            if (mtdInterval) clearInterval(mtdInterval);
            isRunning = false;
            startBtn.disabled = false;
            startBtn.textContent = 'Start Simulation';
        }

    // --- Event Listeners ---
    startBtn.addEventListener('click', runSimulation);
    // Ensure reset explicitly clears running state (don't pass the click event)
    resetBtn.addEventListener('click', () => initializeSimulation(false));

        // Initial setup on page load
        initializeSimulation();