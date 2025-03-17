export const arabicQuestions = [
    {
      id: 4,
      question: "ما هي إحداثيات بلدية معينة؟",
      query: `
        MATCH (c:Commune) 
        WHERE c.nom_arabe = $nom_arabe 
        RETURN c.nom_arabe AS communeName, c.latitude AS latitude, c.longitude AS longitude
      `,
      parameters: { nom_arabe: "اسم البلدية" },
      parameterTypes: { nom_arabe: 'string' }, // Specify type as integer
    },
    {
      id: 5,
      question: "ما هي جميع الولايات الموجودة في قاعدة البيانات؟",
      query: `
        MATCH (w:Wilaya) 
        RETURN w.nom_arabe AS wilayaName, w.matricule AS wilayaCode
      `,
      parameters: {},
      parameterTypes: {},
    },
    {
      id: 8,
      question: "ما هي نوع الوحدة  معينة؟",
      query: `
        MATCH (u:Unite)
        WHERE u.nom_arabe = $nom_arabe 
        RETURN u.Type AS unitType
      `,
      parameters: { nom_arabe: "اسم الوحدة" },
      parameterTypes: { nom_arabe: 'string' }, // Specify type as integer
    },
    {
      id: 9,
      question: "ما هي القضايا التي تتعامل معها وحدة معينة؟",
      query: `
        MATCH (a:Affaire)-[:Traiter]-(u:Unite) 
        WHERE u.nom_arabe = $nom_arabe 
        RETURN a
      `,
      parameters: { nom_arabe: "اسم الوحدة" },
      parameterTypes: { nom_arabe: 'string' }, // Specify type as integer
    },
    {
      id: 10,
      question: "ما هي الأشخاص المتورطين في قضية معينة؟",
      query: `
        MATCH (p:Personne)-[:Impliquer]-(a:Affaire) 
        WHERE a.Number = $affaireId 
        RETURN p.\`الاسم\` AS PersonneName, p.\`رقم التعريف الوطني\` AS nationalId
      `,
      parameters: { affaireId: "رقم القضية" },
      parameterTypes: { affaireId: 'string' }, // Specify type as string
    },
    {
      id: 11,
      question: "ما هي الهواتف المملوكة لشخص معين؟",
      query: `
        MATCH (ph:Phone)-[:Proprietaire]-(p:Personne) 
        WHERE p.\`رقم التعريف الوطني\` = $nationalId 
        RETURN ph.num AS phoneNumber, ph.operateur AS phoneOperator
      `,
      parameters: { nationalId: "رقم الهوية الوطنية للشخص" },
      parameterTypes: { nationalId: 'string' }, // Specify type as string
    },
    {
      id: 12,
      question: "ما هي المكالمات الهاتفية التي أجراها شخص معين؟",
      query: `
        MATCH (p:Personne)-[:Proprietaire]-(ph1:Phone)-[c:Appel_telephone]-(ph2:Phone) 
        WHERE p.\`رقم التعريف الوطني\` = $nationalId 
        RETURN ph1.num AS callerNumber, ph2.num AS receiverNumber, c.duree_sec AS callDuration
      `,
      parameters: { nationalId: "رقم الهوية الوطنية للشخص" },
      parameterTypes: { nationalId: 'string' }, // Specify type as string
    },
    {
      id: 13,
      question: "ما هي الكيانات الافتراضية المملوكة لشخص معين؟",
      query: `
        MATCH (v:Virtuel)-[:Proprietaire]-(p:Personne) 
        WHERE p.\`رقم التعريف الوطني\` = $nationalId 
        RETURN v.Nom AS virtualEntityName, v.Type AS virtualEntityType
      `,
      parameters: { nationalId: "رقم الهوية الوطنية للشخص" },
      parameterTypes: { nationalId: 'string' }, // Specify type as string
    },
    {
      id: 14,
      question: "ما هي تفاصيل قضية معينة والأشخاص المتورطين فيها؟",
      query: `
        MATCH (a:Affaire)-[:Impliquer]-(p:Personne) 
        WHERE a.Number = $affaireId 
        RETURN a.date AS AffaireDate, p.\`الاسم\` AS PersonneName, p.\`رقم التعريف الوطني\` AS nationalId
      `,
      parameters: { affaireId: "رقم القضية" },
      parameterTypes: { affaireId: 'string' }, // Specify type as string
    },
    {
      id: 15,
      question: "ما هي المكالمات الهاتفية بين شخصين معينين؟",
      query: `
        MATCH (p1:Personne)-[:Proprietaire]-(ph1:Phone)-[call:Appel_telephone]-(ph2:Phone)-[:Proprietaire]-(p2:Personne)
        WHERE p1.\`رقم التعريف الوطني\` = $nationalId1 AND p2.\`رقم التعريف الوطني\` = $nationalId2
        RETURN ph1.num AS callerNumber, ph2.num AS receiverNumber, call.duree_sec AS callDuration
      `,
      parameters: {
        nationalId1: "رقم الهوية الوطنية للشخص الأول",
        nationalId2: "رقم الهوية الوطنية للشخص الثاني",
      },
      parameterTypes: { nationalId1: 'string', nationalId2: 'string' }, // Specify types as string
    },
    {
      id: 18,
      question: "ما هي  القضايا التي تعاملت معها وحدة معينة؟",
      query: `
        MATCH (a:Affaire)-[:Traiter]-(u:Unite)
        WHERE u.nom_arabe = $nom_arabe
        RETURN a
      `,
      parameters: { nom_arabe: "معرف الوحدة (رقم)" },
      parameterTypes: { nom_arabe: 'string' }, // Specify type as integer
    },
    {
      id: 19,
      question: "ما هي الأشخاص المتورطين في قضية معينة؟",
      query: `
        MATCH (p:Personne)-[:Impliquer]-(a:Affaire)
        WHERE a.Number = $affaireId
        RETURN p
      `,
      parameters: { affaireId: "رقم القضية" },
      parameterTypes: { affaireId: 'string' }, // Specify type as string
    },
    {
      id: 20,
      question: "ما هي عدد المكالمات الهاتفية التي أجراها شخص معين؟",
      query: `
        MATCH (p:Personne)-[:Proprietaire]-(ph:Phone)-[:Appel_telephone]-(:Phone)
        WHERE p.\`رقم التعريف الوطني\` = $nationalId
        RETURN COUNT(ph) AS numberOfCalls
      `,
      parameters: { nationalId: "رقم الهوية الوطنية للشخص" },
      parameterTypes: { nationalId: 'string' }, // Specify type as string
    },
  ];