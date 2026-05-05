import { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlineDesktopComputer, HiOutlineX } from 'react-icons/hi'
import {
    HiOutlineMagnifyingGlass, HiOutlineLightBulb
} from 'react-icons/hi2'

export default function EquipmentSearchDropdown({
    equipmentSearch,
    onSearch,
    onSelect,
    onClear,
    selectedEquipment,
    searchingEquipment,
    equipmentResults,
    recentEquipments,
    showDropdown,
    setShowDropdown
}) {
    const searchRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowDropdown(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [setShowDropdown])

    const dropdownItems = equipmentSearch.length >= 2
        ? equipmentResults
        : recentEquipments

    if (selectedEquipment) {
        return (
            <div className="selected-item-card">
                <div className="selected-item-info">
                    <HiOutlineDesktopComputer size={24} className="selected-item-icon" />
                    <div>
                        <strong>{selectedEquipment.brand} {selectedEquipment.model}</strong>
                        <span>{selectedEquipment.reference} • {selectedEquipment.type?.name || 'N/A'} • S/N: {selectedEquipment.serial_number || 'N/A'}</span>
                    </div>
                </div>
                <button type="button" onClick={onClear} className="btn-clear">
                    <HiOutlineX size={16} /> Changer
                </button>
            </div>
        )
    }

    return (
        <div className="equipment-search-container" ref={searchRef}>
            <div className="search-bar">
                <HiOutlineMagnifyingGlass size={18} className="search-bar-icon" />
                <input
                    type="text"
                    value={equipmentSearch}
                    onChange={(e) => onSearch(e.target.value)}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Rechercher un équipement du parc (marque, modèle, réf)..."
                    className="form-input"
                />
                {searchingEquipment && <span className="search-spinner">⏳</span>}
            </div>

            <AnimatePresence>
                {showDropdown && (dropdownItems.length > 0 || equipmentSearch.length >= 2) && (
                    <motion.div
                        className="equipment-dropdown"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                    >
                        {equipmentSearch.length < 2 && recentEquipments.length > 0 && (
                            <div className="dropdown-label">
                                <HiOutlineLightBulb size={14} /> Équipements récents de votre agence
                            </div>
                        )}
                        {dropdownItems.map(eq => (
                            <div key={eq.id} className="dropdown-item" onClick={() => onSelect(eq)}>
                                <HiOutlineDesktopComputer size={16} className="dropdown-item-icon" />
                                <div className="dropdown-item-text">
                                    <strong>{eq.brand} {eq.model || ''}</strong>
                                    <span>{eq.reference} • {eq.type?.name || ''} • {eq.agency?.name || ''}</span>
                                </div>
                                <span className={`mini-badge status-${eq.status}`}>
                                    {eq.status === 'received' ? 'Reçu' : eq.status === 'repaired' ? 'Réparé' : eq.status}
                                </span>
                            </div>
                        ))}
                        {equipmentSearch.length >= 2 && dropdownItems.length === 0 && !searchingEquipment && (
                            <div className="dropdown-empty">Aucun résultat — l'appareil sera créé automatiquement</div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
