const { useState, useEffect } = React;

function HabitTracker() {
    // ---- State Management ----
    const [habits, setHabits] = useState([]);
    const [newHabit, setNewHabit] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'completed', 'incomplete'
    const [sortBy, setSortBy] = useState('default'); // 'default', 'alphabetical', 'completion'
    const [darkMode, setDarkMode] = useState(false);
    
    // Quote State
    const [quote, setQuote] = useState({ text: '', author: '', loading: true, error: false });

    // ---- Effects ----
    // Fetch Daily Quote
    useEffect(() => {
        const fetchQuote = async () => {
            try {
                // Note: ZenQuotes API restricts direct browser fetches due to CORS. 
                // We use a public CORS proxy (allorigins) to ensure the request strictly succeeds dynamically.
                const targetUrl = encodeURIComponent('https://zenquotes.io/api/today');
                const response = await fetch(`https://api.allorigins.win/get?url=${targetUrl}`);
                
                if (!response.ok) throw new Error('Network response was not ok');
                
                const data = await response.json();
                const parsedData = JSON.parse(data.contents);
                
                setQuote({
                    text: parsedData[0].q,
                    author: parsedData[0].a,
                    loading: false,
                    error: false
                });
            } catch (error) {
                console.error('Error fetching quote:', error);
                setQuote({
                    text: "Fall seven times and stand up eight.",
                    author: "Japanese Proverb",
                    loading: false,
                    error: true
                });
            }
        };
        fetchQuote();
    }, []);

    // Toggle Dark Mode globally
    useEffect(() => {
        darkMode ? document.body.classList.add('dark-mode') : document.body.classList.remove('dark-mode');
    }, [darkMode]);

    // ---- Actions ----
    const handleAddHabit = (e) => {
        e.preventDefault();
        if (!newHabit.trim()) return;
        
        const habit = {
            id: Date.now(),
            text: newHabit.trim(),
            completed: false
        };
        
        // Using Spread Operator (No loops)
        setHabits([...habits, habit]);
        setNewHabit('');
    };

    const toggleCompletion = (id) => {
        // Using map() (Higher-Order Function)
        setHabits(habits.map(habit => 
            habit.id === id ? { ...habit, completed: !habit.completed } : habit
        ));
    };

    const deleteHabit = (id) => {
        // Using filter() (Higher-Order Function)
        setHabits(habits.filter(habit => habit.id !== id));
    };

    // ---- Data Processing (Search, Filter, Sort) strictly using HOFs ----
    const processHabits = () => {
        return habits
            // 1. Search (filter)
            .filter(habit => 
                habit.text.toLowerCase().includes(searchQuery.toLowerCase())
            )
            // 2. Filter by Status (filter)
            .filter(habit => {
                if (filterStatus === 'completed') return habit.completed;
                if (filterStatus === 'incomplete') return !habit.completed;
                return true; // 'all'
            })
            // 3. Sort (sort)
            .sort((a, b) => {
                if (sortBy === 'alphabetical') {
                    return a.text.localeCompare(b.text);
                }
                if (sortBy === 'completion') {
                    // Incomplete (false/0) comes before Completed (true/1)
                    return Number(a.completed) - Number(b.completed);
                }
                return 0; // 'default' keeps chronological order based on id
            });
    };

    const displayedHabits = processHabits();

    // ---- Render ----
    return (
        <div className="app-container">
            <header>
                <h1><i className="fa-solid fa-list-check"></i> Habit Tracker</h1>
                <button 
                    className="theme-toggle" 
                    onClick={() => setDarkMode(!darkMode)}
                    title="Toggle Dark/Light Mode"
                >
                    <i className={darkMode ? "fa-solid fa-sun" : "fa-solid fa-moon"}></i>
                </button>
            </header>

            {/* Quote Section */}
            <div className="quote-section">
                {quote.loading ? (
                    <p><i className="fa-solid fa-spinner fa-spin"></i> Loading daily motivation...</p>
                ) : (
                    <div>
                        <p>"{quote.text}"</p>
                        <span className="quote-author">- {quote.author}</span>
                    </div>
                )}
            </div>

            {/* Input & Controls Grid */}
            <div className="controls-grid">
                <form className="input-group" onSubmit={handleAddHabit}>
                    <input 
                        type="text" 
                        placeholder="Add a new habit..." 
                        value={newHabit}
                        onChange={(e) => setNewHabit(e.target.value)}
                    />
                    <button type="submit"><i className="fa-solid fa-plus"></i></button>
                </form>

                <input 
                    type="text" 
                    placeholder="Search habits..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />

                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="all">All Habits</option>
                    <option value="completed">Completed</option>
                    <option value="incomplete">Incomplete</option>
                </select>

                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="default">Sort: Default</option>
                    <option value="alphabetical">Sort: Alphabetical</option>
                    <option value="completion">Sort: Completion Status</option>
                </select>
            </div>

            {/* Habit List */}
            <div className="habit-list">
                {displayedHabits.length === 0 ? (
                    <div className="empty-state">
                        <p>No habits found. Start by adding one!</p>
                    </div>
                ) : (
                    displayedHabits.map(habit => (
                        <div key={habit.id} className="habit-item">
                            <div className="habit-info">
                                <i className={`fa-solid ${habit.completed ? 'fa-circle-check' : 'fa-circle'}`} 
                                   style={{ color: habit.completed ? 'var(--success-color)' : 'var(--text-color)' }}>
                                </i>
                                <span className={`habit-text ${habit.completed ? 'completed-text' : ''}`}>
                                    {habit.text}
                                </span>
                            </div>
                            <div className="habit-actions">
                                <button 
                                    className="btn-complete" 
                                    onClick={() => toggleCompletion(habit.id)}
                                >
                                    {habit.completed ? 'Undo' : 'Done'}
                                </button>
                                <button 
                                    className="btn-delete" 
                                    onClick={() => deleteHabit(habit.id)}
                                >
                                    <i className="fa-solid fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

// Render the application to the DOM
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<HabitTracker />);