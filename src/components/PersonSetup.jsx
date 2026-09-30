import React, { useState } from 'react';
import { UserPlus, X } from 'lucide-react';

const personColors = [
  '#ff4d8b', '#1a3a3a', '#7457d9', '#e66a2c', '#b67a00', '#27856f',
  '#2574c4', '#a843a4', '#d04444', '#527a2b', '#007f8b', '#795548'
];

export default function PersonSetup({ people, setPeople, onNext }) {
  const [name, setName] = useState('');

  const addPerson = (event) => {
    event.preventDefault();
    if (!name.trim()) return;
    setPeople([...people, {
      id: `p-${Date.now()}`,
      name: name.trim(),
      color: personColors[people.length % personColors.length]
    }]);
    setName('');
  };

  const removePerson = (id) => {
    setPeople(people.filter((person) => person.id !== id));
  };

  return (
    <section className="flow-card people-card">
      <div className="section-label-bar">Teman makan</div>
      <h2>Siapa yang ikut?</h2>

      <form onSubmit={addPerson} className="inline-form">
        <input
          type="text"
          placeholder="Nama teman"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoFocus
        />
        <button type="submit" className="btn-submit" disabled={!name.trim()} aria-label="Add person">
          <UserPlus size={17} />
          Tambah
        </button>
      </form>

      <div className="person-grid">
        {people.map((person) => (
          <div key={person.id} className="person-chip" style={{ '--person-color': person.color }}>
            <span className="person-dot" />
            <span>{person.name}</span>
            <button onClick={() => removePerson(person.id)} aria-label={`Remove ${person.name}`}>
              <X size={14} />
            </button>
          </div>
        ))}
        {people.length === 0 && (
          <div className="empty-state">
            <strong>No people added.</strong>
            <span>Add at least one person before assigning items.</span>
          </div>
        )}
      </div>

      <div className="flow-actions">
        <button className="btn-submit" onClick={onNext} disabled={people.length === 0}>
          Mulai bagi pesanan
        </button>
      </div>
    </section>
  );
}
