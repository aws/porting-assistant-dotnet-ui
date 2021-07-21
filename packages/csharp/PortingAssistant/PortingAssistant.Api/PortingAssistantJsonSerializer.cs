using ElectronCgi.DotNet;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using System;

/**
 * Overriding default Json Serializer in https://github.com/ruidfigueiredo/electron-cgi-dotnet.
 * We do not want Camel case to change dictionary keys.
 **/
namespace PortingAssistant.Api
{
    public class PortingAssistantJsonSerializer : ISerialiser
    {
        private readonly static JsonSerializerSettings _jsonSerializerSettings = new JsonSerializerSettings
        {
            ContractResolver = new CamelCaseExceptDictionaryKeysResolver()
        };

        class CamelCaseExceptDictionaryKeysResolver : CamelCasePropertyNamesContractResolver
        {
            protected override JsonDictionaryContract CreateDictionaryContract(Type objectType)
            {
                JsonDictionaryContract contract = base.CreateDictionaryContract(objectType);

                contract.DictionaryKeyResolver = propertyName => propertyName;

                return contract;
            }
        }

        public object DeserialiseArguments(string args, Type argumentsType)
        {
            try
            {
                return JsonConvert.DeserializeObject(args, argumentsType);
            }
            catch (JsonReaderException inner)
            {
                throw new SerialiserException("Failed to deserialise arguments", inner);
            }
        }

        public Request DeserialiseRequest(string serialiserRequest)
        {
            try
            {
                return JsonConvert.DeserializeObject<Request>(serialiserRequest);
            }
            catch (JsonReaderException inner)
            {
                throw new SerialiserException("Invalid format in request: " + serialiserRequest + ".", inner);
            }
        }

        public ChannelMessage DeserializeMessage(string message)
        {
            try
            {
                return JsonConvert.DeserializeObject<ChannelMessage>(message);
            }
            catch (JsonReaderException inner)
            {
                throw new SerialiserException("Invalid format in serialized message: " + message + ".", inner);
            }
        }

        public string Serialise(object obj)
        {
            try
            {
                return JsonConvert.SerializeObject(obj, _jsonSerializerSettings);
            }
            catch (JsonSerializationException inner)
            {
                throw new SerialiserException($"Serialisation failed for: {obj}.", inner);
            }
        }
    }
}
