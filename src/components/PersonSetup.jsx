import React, { useState } from 'react';
import { UserPlus, X } from 'lucide-react';

const personColors = ['#ff4d8b', '#1a3a3a', '#b8a4ed', '#ffb084', '#e8b94a', '#a4d4c5'];

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
      <div className="section-label-bar">Player register</div>
      <h2>Who is splitting?</h2>

      <form onSubmit={addPerson} className="inline-form">
        <input
          type="text"
          placeholder="Enter name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoFocus
        />
        <button type="submit" className="btn-submit" disabled={!name.trim()} aria-label="Add person">
          <UserPlus size={17} />
          Add
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
          Start splitting
        </button>
      </div>
    </section>
  );
}
