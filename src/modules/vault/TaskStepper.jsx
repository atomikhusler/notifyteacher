import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Bold, Italic, Strikethrough, Link as LinkIcon, Quote } from 'lucide-react';
import { triggerHaptic } from '../../core/hardwareBridge.js';
import { eliteSpring } from '../../core/animations.js';

const DRAFT_KEY = 'notify_unsaved_draft';

export function TaskStepper({ initialData, onSave, onClose }) {
    const [title, setTitle] = useState('');
    const [descriptionHTML, setDescriptionHTML] = useState('');
    const [letterNo, setLetterNo] = useState('');
    const [startDate, setStartDate] = useState('');
    const [deadlineDate, setDeadlineDate] = useState('');
    
    const [activeFormats, setActiveFormats] = useState({ bold: false, italic: false, strike: false, quote: false });
    
    // Link UI & Memory State
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [savedRange, setSavedRange] = useState(null); // Remembers highlighted text
    
    const editorRef = useRef(null);
    const linkInputRef = useRef(null);

    // Boot & Draft Recovery
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        if (initialData) {
            setTitle(initialData.title || '');
            setDescriptionHTML(initialData.description || '');
            setLetterNo(initialData.letter_no || '');
            setStartDate(initialData.start_date || today);
            setDeadlineDate(initialData.deadline_date || tomorrowStr);
            if (editorRef.current && initialData.description) editorRef.current.innerHTML = initialData.description;
        } else {
            const savedDraft = localStorage.getItem(DRAFT_KEY);
            if (savedDraft) {
                try {
                    const parsed = JSON.parse(savedDraft);
                    setTitle(parsed.title || '');
                    setDescriptionHTML(parsed.descriptionHTML || '');
                    setLetterNo(parsed.letterNo || '');
                    setStartDate(parsed.startDate || today);
                    setDeadlineDate(parsed.deadlineDate || tomorrowStr);
                    if (editorRef.current && parsed.descriptionHTML) editorRef.current.innerHTML = parsed.descriptionHTML;
                } catch (e) {
                    console.error("Draft restore failed", e);
                }
            } else {
                setStartDate(today);
                setDeadlineDate(tomorrowStr);
            }
        }
    }, [initialData]);

    // Auto-Save background tick (Debounced for zero lag)
    useEffect(() => {
        if (!initialData) { 
            const timer = setTimeout(() => {
                const draft = { title, descriptionHTML, letterNo, startDate, deadlineDate };
                localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
            }, 1000); // Waits 1 second after typing stops before saving to disk
            
            // Cleanup function destroys the old timer if the user types again
            return () => clearTimeout(timer); 
        }
    }, [title, descriptionHTML, letterNo, startDate, deadlineDate, initialData]);
  
    // Smart Date Logic
    const handleStartDateChange = (e) => {
        const newStart = e.target.value;
        setStartDate(newStart);
        if (new Date(newStart) > new Date(deadlineDate)) setDeadlineDate(newStart);
    };

    const handleEndDateChange = (e) => {
        const newEnd = e.target.value;
        if (new Date(newEnd) < new Date(startDate)) {
            triggerHaptic('error').catch(()=>{});
            setDeadlineDate(startDate);
        } else {
            setDeadlineDate(newEnd);
        }
    };

    // --- RICH TEXT ENGINE ---
    const checkFormatting = () => {
        setActiveFormats({
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            strike: document.queryCommandState('strikeThrough'),
            quote: document.queryCommandValue('formatBlock') === 'blockquote' || document.queryCommandValue('formatBlock') === 'BLOCKQUOTE'
        });
    };

    const applyFormat = (command, value = null) => {
        triggerHaptic('light').catch(()=>{});
        document.execCommand(command, false, value);
        if (editorRef.current) {
            setDescriptionHTML(editorRef.current.innerHTML);
            editorRef.current.focus();
            checkFormatting();
        }
    };

    // Smart Quote Toggle (Fixes the trap bug)
    const toggleQuote = () => {
        if (activeFormats.quote) {
            applyFormat('formatBlock', 'DIV'); // Exits the quote
        } else {
            applyFormat('formatBlock', 'BLOCKQUOTE'); // Enters the quote
        }
    };

    // Link Memory Flow
    const openLinkPrompt = () => {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            setSavedRange(selection.getRangeAt(0)); // Snapshot the highlighted word
        }
        setShowLinkInput(true);
    };

    const confirmLink = () => {
        if (linkUrl) {
            const formattedUrl = linkUrl.match(/^https?:\/\//) ? linkUrl : `https://${linkUrl}`;
            editorRef.current.focus();
            
            // Restore the highlighted word
            if (savedRange) {
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(savedRange);
            }

            // Fallback: If they didn't highlight anything, inject the raw URL text
            const selection = window.getSelection();
            if (selection.isCollapsed) {
                document.execCommand('insertHTML', false, `<a href="${formattedUrl}">${formattedUrl}</a>`);
            } else {
                document.execCommand('createLink', false, formattedUrl);
            }
            
            if (editorRef.current) setDescriptionHTML(editorRef.current.innerHTML);
        }
        setShowLinkInput(false);
        setLinkUrl('');
        setSavedRange(null);
    };

    const handleEditorInput = () => {
        if (editorRef.current) {
            setDescriptionHTML(editorRef.current.innerHTML);
            checkFormatting();
        }
    };

    const handleSave = () => {
        if (!title.trim()) {
            triggerHaptic('error').catch(()=>{});
            return; 
        }
        triggerHaptic('success').catch(()=>{});
        localStorage.removeItem(DRAFT_KEY); 
        
        onSave({
            ...initialData,
            id: initialData?.id || `task-${Date.now()}`,
            title: title.trim(),
            description: descriptionHTML.trim(),
            letter_no: letterNo.trim(),
            start_date: startDate,
            deadline_date: deadlineDate,
            isCompleted: initialData?.isCompleted || false,
            created_at: initialData?.created_at || new Date().toISOString()
        });
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 50 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 50 }} 
            transition={eliteSpring}
            className="fixed inset-0 z-[40] overflow-y-auto hide-scrollbar bg-app-base"
        >
            <div className="w-full min-h-full flex flex-col gap-6 px-4 pt-[90px] pb-[120px]">
                
                {/* Header Title */}
                <div className="flex items-center gap-2 mb-2 opacity-60">
                    <div className="w-1.5 h-4 bg-brand-primary rounded-full"></div>
                    <h2 className="text-xs font-bold text-content uppercase tracking-widest">
                        {initialData ? 'Edit Private Entry' : 'New Private Entry'}
                    </h2>
                </div>

                {/* 1. Title Input */}
                <div>
                    <input 
                        type="text" 
                        placeholder="Notice Title..." 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-transparent text-content text-[28px] font-bold placeholder-content-muted/40 focus:outline-none"
                    />
                </div>

                {/* 2. Date Engine */}
                <div className="flex gap-4">
                    <div className="flex-1 bg-surface-elevated rounded-[16px] p-4 shadow-sm border border-glass-border/30">
                        <label className="text-[10px] font-bold text-content-muted uppercase tracking-widest block mb-2">Start Date</label>
                        <input 
                            type="date" 
                            value={startDate}
                            onChange={handleStartDateChange}
                            className="w-full bg-transparent text-content text-[15px] font-bold focus:outline-none appearance-none"
                        />
                    </div>
                    <div className="flex-1 bg-surface-elevated rounded-[16px] p-4 shadow-sm border border-glass-border/30">
                        <label className="text-[10px] font-bold text-content-muted uppercase tracking-widest block mb-2">End Date</label>
                        <input 
                            type="date" 
                            value={deadlineDate}
                            onChange={handleEndDateChange}
                            min={startDate} 
                            className="w-full bg-transparent text-content text-[15px] font-bold focus:outline-none appearance-none"
                        />
                    </div>
                </div>

                {/* 3. Reference Number */}
                <div className="bg-surface-elevated rounded-[16px] p-4 flex items-center shadow-sm border border-glass-border/30">
                    <span className="text-xs font-mono font-bold text-brand-primary mr-3">REF:</span>
                    <input 
                        type="text" 
                        placeholder="Letter or Order No (Optional)" 
                        value={letterNo}
                        onChange={(e) => setLetterNo(e.target.value)}
                        className="flex-1 bg-transparent text-content text-sm font-mono focus:outline-none"
                    />
                </div>

                {/* 4. True WYSIWYG Details Editor */}
                <div className="flex flex-col bg-surface-elevated rounded-[20px] overflow-hidden shadow-sm border border-glass-border/30 relative">
                    
                    {/* DETAILS Hint Header */}
                    <div className="px-5 pt-4 pb-1">
                        <span className="text-xs font-mono font-bold text-brand-primary">DETAILS:</span>
                    </div>

                    {/* Editable Content Area (Shrunk min-height as requested) */}
                    <div 
                        ref={editorRef}
                        contentEditable="true"
                        onInput={handleEditorInput}
                        onKeyUp={checkFormatting}
                        onMouseUp={checkFormatting}
                        className="w-full bg-transparent text-content text-[15px] px-5 pb-5 min-h-[40px] focus:outline-none leading-relaxed overflow-y-auto hide-scrollbar 
                        empty:before:content-['Add_instructions,_or_links...'] empty:before:text-content-muted/40 empty:before:pointer-events-none
                        [&_blockquote]:border-l-4 [&_blockquote]:border-brand-primary [&_blockquote]:pl-3 [&_blockquote]:py-1 [&_blockquote]:my-3 [&_blockquote]:text-content-muted [&_blockquote]:bg-brand-primary/5 [&_blockquote]:rounded-r-lg
                        [&_a]:text-brand-primary [&_a]:underline [&_a]:decoration-brand-primary/40 [&_a]:font-bold"
                        style={{ WebkitUserSelect: 'text', userSelect: 'text' }}
                    />

                    {/* Integrated Formatting Toolbar (LAG FIX & OVERFLOW FIX) */}
                    <div className="flex items-center p-2 border-t border-glass-border/30 bg-black/5 min-h-[56px] w-full">
                        {showLinkInput ? (
                            /* Safari-style URL Pill Container */
                            <div className="flex items-center w-full gap-2 bg-surface-elevated rounded-[14px] px-2 py-1.5 border border-glass-border shadow-sm animate-in fade-in duration-200">
                                <LinkIcon size={16} className="text-content-muted flex-shrink-0 ml-1" />
                                
                                {/* w-0 is the magic trick that prevents flex overflow */}
                                <input 
                                    ref={linkInputRef}
                                    type="url" 
                                    placeholder="https://..." 
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && confirmLink()}
                                    className="flex-1 w-0 bg-transparent text-content text-[15px] focus:outline-none placeholder-content-muted/50"
                                    autoFocus
                                />
                                
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <button onClick={confirmLink} className="p-2 bg-brand-primary/10 text-brand-primary rounded-lg active:scale-95 transition-transform flex-shrink-0">
                                        <Check size={18} strokeWidth={2.5} />
                                    </button>
                                    <button onClick={() => setShowLinkInput(false)} className="p-2 bg-surface border border-glass-border text-content-muted rounded-lg active:scale-95 transition-transform flex-shrink-0">
                                        <X size={18} strokeWidth={2.5} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Standard Tools */
                            <div className="flex items-center gap-1.5 w-full animate-in fade-in duration-200 overflow-x-auto hide-scrollbar">
                                <button onClick={() => applyFormat('bold')} className={`p-2.5 rounded-xl transition-colors flex-shrink-0 ${activeFormats.bold ? 'bg-brand-primary/20 text-brand-primary' : 'text-content-muted hover:text-content'}`}><Bold size={18}/></button>
                                <button onClick={() => applyFormat('italic')} className={`p-2.5 rounded-xl transition-colors flex-shrink-0 ${activeFormats.italic ? 'bg-brand-primary/20 text-brand-primary' : 'text-content-muted hover:text-content'}`}><Italic size={18}/></button>
                                <button onClick={() => applyFormat('strikeThrough')} className={`p-2.5 rounded-xl transition-colors flex-shrink-0 ${activeFormats.strike ? 'bg-brand-primary/20 text-brand-primary' : 'text-content-muted hover:text-content'}`}><Strikethrough size={18}/></button>
                                
                                <div className="w-px h-6 bg-glass-border mx-1 flex-shrink-0"></div>
                                
                                <button onClick={openLinkPrompt} className="p-2.5 text-content-muted hover:text-content rounded-xl transition-colors flex-shrink-0"><LinkIcon size={18}/></button>
                                <button onClick={toggleQuote} className={`p-2.5 rounded-xl transition-colors flex-shrink-0 ${activeFormats.quote ? 'bg-brand-primary/20 text-brand-primary' : 'text-content-muted hover:text-content'}`}><Quote size={18}/></button>
                            </div>
                        )}
                    </div>
                </div>

                {/* 5. Ergonomic Bottom Action Buttons */}
                <div className="flex gap-4 mt-4">
                    <button 
                        onClick={() => { triggerHaptic('light'); onClose(); }} 
                        className="flex-1 py-4 rounded-[16px] bg-brand-danger/10 border border-brand-danger/20 text-brand-danger font-bold uppercase tracking-widest text-xs active:scale-95 transition-transform"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave} 
                        disabled={!title.trim()}
                        className={`flex-1 py-4 rounded-[16px] font-bold uppercase tracking-widest text-xs active:scale-95 transition-all ${
                            title.trim() 
                            ? 'bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)] border border-green-400' 
                            : 'bg-surface-elevated text-content-muted border border-glass-border opacity-50'
                        }`}
                    >
                        Save Entry
                    </button>
                </div>

            </div>
        </motion.div>
    );
}