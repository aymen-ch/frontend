export const arabicQuestions = [
    {
      id: 9,
      question: "ما هي القضايا التي تتعامل معها وحدة معينة؟",
      query: `
        MATCH path=(a:Affaire)-[:Traiter]-(u:Unite) 
        WHERE u.nom_arabe = $nom_arabe 
        RETURN path
      `,
      parameters: { nom_arabe: "اسم الوحدة" },
      parameterTypes: { nom_arabe: 'string' }, // Specify type as integer
    },
    {
      id: 10,
      question: "من هم الأشخاص المتورطين في قضية معينة؟",
      query: `
        MATCH path=(p:Personne)-[:Impliquer]-(a:Affaire) 
        WHERE a.Number = $affaireId 
        RETURN path
      `,
      parameters: { affaireId: "رقم القضية" },
      parameterTypes: { affaireId: 'string' }, // Specify type as string
    },
    {
      id: 11,
      question: "ما هي الهواتف المملوكة لشخص معين؟",
      query: `
        MATCH path=(ph:Phone)-[:Proprietaire]-(p:Personne) 
        WHERE p.\`رقم التعريف الوطني\` = $nationalId 
        RETURN path
      `,
      parameters: { nationalId: "رقم الهوية الوطنية للشخص" },
      parameterTypes: { nationalId: 'string' }, // Specify type as string
    },
    {
      id: 12,
      question: "ما هي المكالمات الهاتفية التي أجراها شخص معين؟",
      query: `
        MATCH path=(p:Personne)-[:Proprietaire]-(ph1:Phone)-[c:Appel_telephone]-(ph2:Phone) 
        WHERE p.\`رقم التعريف الوطني\` = $nationalId 
        RETURN path
      `,
      parameters: { nationalId: "رقم الهوية الوطنية للشخص" },
      parameterTypes: { nationalId: 'string' }, // Specify type as string
    },
    {
      id: 13,
      question: "ما هي الكيانات الافتراضية المملوكة لشخص معين؟",
      query: `
        MATCH path=(v:Virtuel)-[:Proprietaire]-(p:Personne) 
        WHERE p.\`رقم التعريف الوطني\` = $nationalId 
        RETURN path
      `,
      parameters: { nationalId: "رقم الهوية الوطنية للشخص" },
      parameterTypes: { nationalId: 'string' }, // Specify type as string
    },
    // {
    //   id: 14,
    //   question: "ما هي تفاصيل قضية معينة والأشخاص المتورطين فيها؟",
    //   query: `
    //     MATCH (a:Affaire)-[:Impliquer]-(p:Personne) 
    //     WHERE a.Number = $affaireId 
    //     RETURN a.date AS AffaireDate, p.\`الاسم\` AS PersonneName, p.\`رقم التعريف الوطني\` AS nationalId
    //   `,
    //   parameters: { affaireId: "رقم القضية" },
    //   parameterTypes: { affaireId: 'string' }, // Specify type as string
    // },
    {
      id: 15,
      question: "ما هي المكالمات الهاتفية بين شخصين معينين؟",
      query: `
        MATCH path=(p1:Personne)-[:Proprietaire]-(ph1:Phone)-[call:Appel_telephone]-(ph2:Phone)-[:Proprietaire]-(p2:Personne)
        WHERE p1.\`رقم التعريف الوطني\` = $nationalId1 AND p2.\`رقم التعريف الوطني\` = $nationalId2
        RETURN path
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
        MATCH path=(a:Affaire)-[:Traiter]-(u:Unite)
        WHERE u.nom_arabe = $nom_arabe
        RETURN path
      `,
      parameters: { nom_arabe: "معرف الوحدة (رقم)" },
      parameterTypes: { nom_arabe: 'string' }, // Specify type as integer
    },
    {
      id: 19,
      question: "ما هي الأشخاص المتورطين في قضية معينة؟",
      query: `
        MATCH path=(p:Personne)-[:Impliquer]-(a:Affaire)
        WHERE a.Number = $affaireId
        RETURN path
      `,
      parameters: { affaireId: "رقم القضية" },
      parameterTypes: { affaireId: 'string' }, // Specify type as string
    },
    // {
    //   id: 20,
    //   question: "ما هي عدد المكالمات الهاتفية التي أجراها شخص معين؟",
    //   query: `
    //     MATCH (p:Personne)-[:Proprietaire]-(ph:Phone)-[:Appel_telephone]-(:Phone)
    //     WHERE p.\`رقم التعريف الوطني\` = $nationalId
    //     RETURN COUNT(ph) AS numberOfCalls
    //   `,
    //   parameters: { nationalId: "رقم الهوية الوطنية للشخص" },
    //   parameterTypes: { nationalId: 'string' }, // Specify type as string
    // },
  ];